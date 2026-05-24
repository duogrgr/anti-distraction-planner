<script>
  import { exportTasks, importTasks, getTasks } from '../lib/db.js'
  import { useTasks } from '../lib/stores/tasks.svelte.js'
  import { useSettings } from '../lib/stores/settings.svelte.js'
  
  let { onClose = () => {} } = $props()
  
  const store = useTasks()
  const settings = useSettings()
  
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
    
    event.target.value = ''
  }
</script>

<div class="min-h-screen bg-background text-foreground flex flex-col">
  <header class="p-8 pb-4 flex justify-between items-start">
    <button 
      onclick={onClose}
      class="text-sm font-normal opacity-40 hover:opacity-100 transition-opacity"
    >
      ← BACK
    </button>
    <h1 class="text-sm font-normal opacity-40">SETTINGS</h1>
    <div class="w-12"></div>
  </header>
  
  <main class="flex-1 overflow-y-auto px-8 pb-8 space-y-10">
    
    <!-- FONT SIZE -->
    <section>
      <h2 class="text-xs font-normal opacity-40 mb-4">FONT SIZE</h2>
      <div class="flex gap-2">
        {#each ['sm', 'md', 'lg', 'xl'] as size}
          <button
            onclick={() => settings.update('fontSize', size)}
            class="flex-1 py-4 text-xl font-bold border-2 transition-all"
            class:border-current={settings.fontSize === size}
            class:bg-foreground={settings.fontSize === size}
            class:text-background={settings.fontSize === size}
            class:border-current/20={settings.fontSize !== size}
          >
            {size.toUpperCase()}
          </button>
        {/each}
      </div>
    </section>
    
    <!-- ALIGNMENT -->
    <section>
      <h2 class="text-xs font-normal opacity-40 mb-4">ALIGNMENT</h2>
      <div class="flex gap-2">
        {#each [
          { value: 'left', label: '← LEFT' },
          { value: 'center', label: '↔ CENTER' },
          { value: 'right', label: 'RIGHT →' },
        ] as option}
          <button
            onclick={() => settings.update('alignment', option.value)}
            class="flex-1 py-4 text-lg font-bold border-2 transition-all"
            class:border-current={settings.alignment === option.value}
            class:bg-foreground={settings.alignment === option.value}
            class:text-background={settings.alignment === option.value}
            class:border-current/20={settings.alignment !== option.value}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </section>
    
    <!-- BORDER -->
    <section>
      <h2 class="text-xs font-normal opacity-40 mb-4">MARGIN</h2>
      <div class="flex gap-2">
        {#each [
          { value: 'narrow', label: 'NARROW' },
          { value: 'normal', label: 'NORMAL' },
          { value: 'wide', label: 'WIDE' },
        ] as option}
          <button
            onclick={() => settings.update('border', option.value)}
            class="flex-1 py-4 text-lg font-bold border-2 transition-all"
            class:border-current={settings.border === option.value}
            class:bg-foreground={settings.border === option.value}
            class:text-background={settings.border === option.value}
            class:border-current/20={settings.border !== option.value}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </section>
    
    <hr class="border-current/10" />
    
    <!-- DATA -->
    <section>
      <h2 class="text-xs font-normal opacity-40 mb-4">DATA</h2>
      <div class="space-y-3">
        <button
          onclick={handleExport}
          class="w-full py-5 text-2xl font-bold border-t-2 border-b-2 border-current hover:opacity-60 transition-opacity"
        >
          EXPORT
        </button>
        
        <button
          onclick={handleImportClick}
          class="w-full py-5 text-2xl font-bold border-t-2 border-b-2 border-current hover:opacity-60 transition-opacity"
        >
          IMPORT
        </button>
      </div>
      
      <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        onchange={handleImport}
        class="hidden"
      />
    </section>
    
    <!-- RESET -->
    <section>
      <button
        onclick={() => {
          if (confirm('Reset all settings to default?')) {
            settings.reset()
          }
        }}
        class="w-full py-3 text-sm font-normal opacity-40 hover:opacity-100 transition-opacity"
      >
        RESET TO DEFAULTS
      </button>
    </section>
    
    {#if status}
      <p class="text-center text-sm font-normal opacity-60 pt-4">
        {status}
      </p>
    {/if}
  </main>
  
  <footer class="px-8 py-4 text-center text-xs font-normal opacity-30 border-t border-current/10">
    YOUR DATA IS STORED LOCALLY
  </footer>
</div>