<script>
  import { useTasks } from '../lib/stores/tasks.svelte.js'
  import { onMount } from 'svelte'
  
  let { task = null, onDone = () => {} } = $props()
  
  const store = useTasks()
  
  let text = $state(task?.text || '')
  let repeat = $state(task?.repeat || 'none')
  let textareaElement
  
  const isEditing = $derived(task !== null)
  const title = $derived(isEditing ? 'EDIT TASK' : 'NEW TASK')
  
  onMount(() => {
    // Автофокус с задержкой для мобильных
    setTimeout(() => {
      textareaElement?.focus()
    }, 100)
  })
  
  async function save() {
    if (!text.trim()) return
    
    if (isEditing) {
      await store.update(task.id, { text: text.trim(), repeat })
    } else {
      await store.add(text.trim(), repeat)
    }
    
    text = ''
    repeat = 'none'
    onDone()
  }
  
  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      save()
    }
  }
</script>

<div class="min-h-screen bg-background text-foreground p-8 flex flex-col">
  <header class="mb-12">
    <h1 class="text-sm font-normal opacity-40">{title}</h1>
  </header>
  
  <textarea
    bind:this={textareaElement}
    bind:value={text}
    onkeydown={handleKeydown}
    placeholder="what needs to be done?"
    class="flex-1 w-full bg-transparent text-4xl font-bold placeholder:opacity-20 outline-none resize-none leading-tight"
    autofocus
  />
  
  <div class="mt-8 space-y-6">
    <button
      onclick={() => repeat = repeat === 'none' ? 'daily' : 'none'}
      class="w-full text-left text-2xl font-bold opacity-60 hover:opacity-100 transition-opacity"
    >
      REPEAT: {repeat === 'none' ? 'OFF' : 'DAILY'}
    </button>
    
    <button
      onclick={save}
      disabled={!text.trim()}
      class="w-full py-4 text-3xl font-bold border-t-2 border-current disabled:opacity-20 transition-opacity"
    >
      SAVE
    </button>
  </div>
</div>

<style>
  textarea {
    font-family: inherit;
  }
</style>