import { getTasks, addTask, updateTask, deleteTask } from '../db.js'

let tasks = $state([])
let isLoading = $state(true)
let error = $state(null)

export function useTasks() {
  async function load() {
    try {
      isLoading = true
      error = null
      tasks = await getTasks()
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
    tasks.push(task)
  }

  async function toggleComplete(id) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const today = getToday()
    const isCompleted = task.completedDates.includes(today)

    if (isCompleted) {
      task.completedDates = task.completedDates.filter((d) => d !== today)
      task.isCompleting = false
    } else {
      task.completedDates.push(today)
      task.isCompleting = true

      setTimeout(async () => {
        task.isDissolving = true
        await new Promise((resolve) => setTimeout(resolve, 400))
        
        if (task.repeat === 'none') {
          await deleteTask(id)
          tasks = tasks.filter((t) => t.id !== id)
        } else {
          task.isDissolving = false
          task.isCompleting = false
          await updateTask(task)
        }
      }, 20000)
    }

    await updateTask(task)
  }

  return {
    get tasks() { return tasks },
    get isLoading() { return isLoading },
    get error() { return error },
    load,
    getTasksForDate,
    add,
    toggleComplete,
  }
}