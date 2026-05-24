import { getTasks, addTask, updateTask, deleteTask } from '../db.js'

let tasks = $state([])
let isLoading = $state(true)
let error = $state(null)

const dissolveTimers = new Map()

export function useTasks() {
  async function load() {
    try {
      isLoading = true
      error = null
      const loaded = await getTasks()
      tasks = loaded
      console.log('Tasks loaded:', tasks.length)
    } catch (err) {
      console.error('Load error:', err)
      error = err.message
      tasks = []
    } finally {
      isLoading = false
    }
  }

  function getToday() {
    return new Date().toISOString().split('T')[0]
  }

  function getTasksForDate(date) {
    const today = new Date(date)
    return tasks.filter((task) => {
      if (task.repeat === 'daily') {
        return new Date(task.createdAt) <= today
      }
      return new Date(task.createdAt).toISOString().split('T')[0] === date
    })
  }

  async function add(text, repeat = 'none') {
    const task = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
      repeat,
      completedDates: [],
    }
    await addTask(task)
    tasks = [...tasks, task]
  }

  async function toggleComplete(id) {
    const taskIndex = tasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) return
    
    const task = tasks[taskIndex]
    const today = getToday()
    const isCompleted = task.completedDates.includes(today)

    if (dissolveTimers.has(id)) {
      clearTimeout(dissolveTimers.get(id))
      dissolveTimers.delete(id)
    }

    if (isCompleted) {
      // Undo
      task.completedDates = task.completedDates.filter((d) => d !== today)
      task.isCompleting = false
      task.isDissolving = false
      await updateTask(task)
      tasks = tasks.map((t, i) => i === taskIndex ? { ...task } : t)
      console.log('Task undone:', task.text)
    } else {
      // Complete
      task.completedDates = [...task.completedDates, today]
      task.isCompleting = true
      await updateTask(task)
      tasks = tasks.map((t, i) => i === taskIndex ? { ...task } : t)
      console.log('Task completed:', task.text)

      // Таймер на 5 секунд (для теста)
      const timer = setTimeout(async () => {
        console.log('Timer fired for task:', task.text)
        dissolveTimers.delete(id)
        
        const freshIndex = tasks.findIndex((t) => t.id === id)
        if (freshIndex === -1) {
          console.log('Task not found in array')
          return
        }
        
        console.log('Starting dissolve animation')
        tasks[freshIndex].isDissolving = true
        tasks = [...tasks] // Форсируем обновление
        
        // Ждём анимацию
        await new Promise((resolve) => setTimeout(resolve, 400))
        
        console.log('Animation done, removing task')
        if (tasks[freshIndex].repeat === 'none') {
          console.log('Deleting from DB')
          await deleteTask(id)
          tasks = tasks.filter((t) => t.id !== id)
          console.log('Task removed, remaining:', tasks.length)
        } else {
          console.log('Daily task, resetting state')
          tasks[freshIndex].isDissolving = false
          tasks[freshIndex].isCompleting = false
          await updateTask(tasks[freshIndex])
          tasks = [...tasks]
        }
      }, 5000) // 5 секунд вместо 20
      
      dissolveTimers.set(id, timer)
      console.log('Timer set for 5 seconds')
    }
  }

  async function update(id, updates) {
    const taskIndex = tasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) return

    const task = { ...tasks[taskIndex], ...updates }
    await updateTask(task)
    tasks = tasks.map((t, i) => i === taskIndex ? task : t)
  }

  async function remove(id) {
    if (dissolveTimers.has(id)) {
      clearTimeout(dissolveTimers.get(id))
      dissolveTimers.delete(id)
    }
    await deleteTask(id)
    tasks = tasks.filter((t) => t.id !== id)
  }

  return {
    get tasks() { return tasks },
    get isLoading() { return isLoading },
    get error() { return error },
    load,
    getTasksForDate,
    add,
    toggleComplete,
    update,
    remove,
  }
}