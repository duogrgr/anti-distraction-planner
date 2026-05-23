<script>
  import { exportTasks, importTasks, getTasks } from '../lib/db.js'
  import { useTasks } from '../lib/stores/tasks.svelte.js'
  
  let { onClose = () => {} } = $props()
  
  const store = useTasks()
  
  let status = $state('')
  let fileInput = $state(null)
  
  async function handleExport() {
    try {
      const json = await exportTasks()
      const tasks = await getTasks()
      const date = new Date().toISOString().split('T')[0]
      
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `planner-backup-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      status = `EXPORTED ${tasks.length} TASKS`
      setTimeout(() => status = '', 3000)
    } catch (err) {
      status = `ERROR: ${err.message}`
    }
  }
  
  function handleImportClick() {
    fileInput?.click()
  }
  
  async function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const tasks = JSON.parse(text)
      
      if (!Array.isArray(tasks)) {
        throw new Error('Invalid file format')
      }
      
      await importTasks(text)
      await store.load()
      
      status = `IMPORTED ${tasks.length} TASKS`
      setTimeout(() => status = '', 3000)
    } catch (err) {
      status = `ERROR: ${err.message}`
    }
    
    // Сбрасываем input, чтобы можно было импортировать тот же файл повторно
    event.target.value = ''
  }
</script>

<div class="min-h-screen bg-background text-foreground p-8 flex flex-col">
  <header class="mb-12 flex justify-between items-start">
    <button 
      onclick={onClose}
      class="text-sm font-normal opacity-40 hover:opacity-100 transition-opacity"
    >
      ← BACK
    </button>
    <h1 class="text-sm font-normal opacity-40">SETTINGS</h1>
    <div class="w-12"></div>
  </header>
  
  <main class="flex-1 flex flex-col justify-center space-y-6">
    <button
      onclick={handleExport}
      class="w-full py-6 text-3xl font-bold border-t-2 border-b-2 border-current hover:opacity-60 transition-opacity"
    >
      EXPORT
    </button>
    
    <button
      onclick={handleImportClick}
      class="w-full py-6 text-3xl font-bold border-t-2 border-b-2 border-current hover:opacity-60 transition-opacity"
    >
      IMPORT
    </button>
    
    <input
      bind:this={fileInput}
      type="file"
      accept="application/json,.json"
      onchange={handleImport}
      class="hidden"
    />
    
    {#if status}
      <p class="text-center text-sm font-normal opacity-60 mt-8">
        {status}
      </p>
    {/if}
  </main>
  
  <footer class="text-center text-xs font-normal opacity-30">
    YOUR DATA IS STORED LOCALLY
  </footer>
</div>