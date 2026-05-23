import { openDB } from 'idb'

const dbPromise = openDB('anti-distraction-planner', 1, {
  upgrade(db) {
    db.createObjectStore('tasks', { keyPath: 'id' })
  },
})

export async function getTasks() {
  const db = await dbPromise
  return db.getAll('tasks')
}

export async function addTask(task) {
  const db = await dbPromise
  await db.put('tasks', task)
}

export async function updateTask(task) {
  const db = await dbPromise
  await db.put('tasks', task)
}

export async function deleteTask(id) {
  const db = await dbPromise
  await db.delete('tasks', id)
}

export async function exportTasks() {
  const tasks = await getTasks()
  return JSON.stringify(tasks, null, 2)
}

export async function importTasks(json) {
  const tasks = JSON.parse(json)
  const db = await dbPromise
  const tx = db.transaction('tasks', 'readwrite')
  await Promise.all(tasks.map((task) => tx.store.put(task)))
  await tx.done
}