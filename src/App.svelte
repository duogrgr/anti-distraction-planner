<script>
  import { useTasks } from './lib/stores/tasks.svelte.js'
  import { useTheme } from './lib/stores/theme.svelte.js'
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import Input from './routes/Input.svelte'
  import Calendar from './routes/Calendar.svelte'
  import Settings from './routes/Settings.svelte'
  import { daySwipe } from './lib/daySwipe.js'
  
  const store = useTasks()
  const theme = useTheme()
  
  let currentDate = $state(new Date().toISOString().split('T')[0])
  let currentScreen = $state('today')
  let editingTask = $state(null)
  
  let longPressTimer = $state(null)
  let longPressTriggered = $state(false)
  
  let slideDirection = $state('left')
  
  const today = $derived(new Date().toISOString().split('T')[0])
  const isToday = $derived(currentDate === today)
  
  const minDate = $derived.by(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const canGoBack = $derived(currentDate > minDate)
  
  function fadeScale(node, { duration = 400, easing = (t) => t, baseScale = 0.95 } = {}) {
    return {
      duration,
      easing,
      css: (t) => `opacity: ${t}; transform: scale(${baseScale + (1 - baseScale) * t})`
    }
  }
  
  onMount(() => {
    store.load()
  })
  
  function formatDate(dateString) {
    const date = new Date(dateString)
    const options = { weekday: 'long', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-US', options).toUpperCase()
  }
  
  function changeDate(days) {
    slideDirection = days > 0 ? 'left' : 'right'
    const date = new Date(currentDate)
    date.setDate(date.getDate() + days)
    const newDate = date.toISOString().split('T')[0]
    
    if (newDate < minDate) return
    
    currentDate = newDate
  }
  
  function goToday() {
    if (isToday) return
    slideDirection = currentDate < today ? 'left' : 'right'
    currentDate = today
  }
  
  function openNewTask() {
    editingTask = null
    currentScreen = 'input'
  }
  
  function openEditTask(task) {
    editingTask = task
    currentScreen = 'input'
  }
  
  function handleInputDone() {
    currentScreen = 'today'
    editingTask = null
  }
  
  function handleDateSelect(date) {
    slideDirection = date > currentDate ? 'left' : 'right'
    currentDate = date
    currentScreen = 'today'
  }
  
  function handleTouchStart(task) {
    if (task.isDissolving) return
    longPressTriggered = false
    longPressTimer = setTimeout(() => {
      longPressTriggered = true
      if (navigator.vibrate) navigator.vibrate(30)
      openEditTask(task)
    }, 500)
  }
  
  function handleTouchMove() {
    // Движение пальца отменяет long press и сбрасывает флаг
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    longPressTriggered = false
  }
  
  function handleTouchEnd(task) {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    
    if (!longPressTriggered && !task.isDissolving) {
      store.toggleComplete(task.id)
    }
    longPressTriggered = false
  }
  
  function handleTouchCancel() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    longPressTriggered = false
  }
  
  function handleClick(e, task) {
    if (e.pointerType === 'touch') return
    if (task.isDissolving) return
    
    store.toggleComplete(task.id)
  }
</script>

{#if currentScreen === 'calendar'}
  <Calendar onSelectDate={handleDateSelect} />
{:else if currentScreen === 'today'}
  <div 
    class="min-h-screen bg-background text-foreground flex flex-col overflow-hidden"
    use:daySwipe={{ 
      onSwipeLeft: () => changeDate(1), 
      onSwipeRight: () => changeDate(-1),
      canSwipeRight: () => canGoBack,
      threshold: 80
    }}
  >
    {#key currentDate}
      <div
        class="flex-1 flex flex-col p-8"
        in:fly={{ x: slideDirection === 'left' ? 300 : -300, duration: 280, easing: (t) => 1 - Math.pow(1 - t, 3) }}
        out:fly={{ x: slideDirection === 'left' ? -300 : 300, duration: 280, easing: (t) => 1 - Math.pow(1 - t, 3) }}
      >
        <header class="mb-12 flex justify-between items-start">
          <div class="flex flex-col items-start gap-1">
            <button 
              onclick={() => currentScreen = 'calendar'}
              class="text-sm font-normal opacity-40 hover:opacity-100 transition-opacity"
            >
              {formatDate(currentDate)}
            </button>
            
            {#if !isToday}
              <button 
                onclick={goToday}
                class="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
              >
                → TODAY
              </button>
            {/if}
          </div>
          
          <div class="flex gap-4 items-center">
            <button 
              onclick={theme.cycle}
              class="text-lg font-normal opacity-40 hover:opacity-100 transition-opacity"
              title={theme.label}
            >
              {theme.icon}
            </button>
            <button 
              onclick={openNewTask}
              class="text-2xl font-bold opacity-40 hover:opacity-100 transition-opacity"
            >
              +
            </button>
          </div>
        </header>
        
        <main class="flex-1">
          {#if store.error}
            <p class="text-2xl font-bold text-red-500">Error: {store.error}</p>
          {:else if store.isLoading}
            <p class="text-4xl font-bold opacity-40">Loading...</p>
          {:else if store.getTasksForDate(currentDate).length === 0}
            <div class="task-list">
              <button 
                onclick={openNewTask} 
                class="task-text font-bold opacity-40 hover:opacity-100 transition-opacity w-full"
                style="text-align: var(--list-alignment)"
              >
                CLEAR MIND
              </button>
            </div>
          {:else}
            <ul class="task-list space-y-6">
              {#each store.getTasksForDate(currentDate) as task (task.id)}
                <li
                  transition:fadeScale={{ duration: 400, baseScale: 0.95 }}
                  animate:flip={{ duration: 300, easing: (t) => 1 - Math.pow(1 - t, 3) }}
                >
                  <button
                    class="w-full task-text font-bold transition-all duration-300 active:opacity-50"
                    class:line-through={task.completedDates.includes(currentDate)}
                    class:opacity-30={task.completedDates.includes(currentDate)}
                    style="text-align: var(--list-alignment)"
                    ontouchstart={() => handleTouchStart(task)}
                    ontouchmove={handleTouchMove}
                    ontouchend={() => handleTouchEnd(task)}
                    ontouchcancel={handleTouchCancel}
                    onclick={(e) => handleClick(e, task)}
                    oncontextmenu={(e) => {
                      e.preventDefault()
                      openEditTask(task)
                    }}
                  >
                    {task.text}
                  </button>
                </li>
              {/each}
            </ul>
            
            <p class="mt-8 text-xs font-normal opacity-20 text-center">
              TAP TO COMPLETE · HOLD TO EDIT · SWIPE TO CHANGE DAY
            </p>
          {/if}
        </main>
        
        <footer class="mt-8 flex justify-start items-center">
          <button 
            onclick={() => currentScreen = 'settings'}
            class="text-sm font-normal opacity-30 hover:opacity-100 transition-opacity"
          >
            ⚙
          </button>
        </footer>
      </div>
    {/key}
  </div>
{:else if currentScreen === 'input'}
  <Input task={editingTask} onDone={handleInputDone} />
{:else if currentScreen === 'settings'}
  <Settings onClose={() => currentScreen = 'today'} />
{/if}