<script>
  import { useTasks } from './lib/stores/tasks.svelte.js'
  import { useTheme } from './lib/stores/theme.svelte.js'
  import { onMount } from 'svelte'
  import Input from './routes/Input.svelte'
  import Calendar from './routes/Calendar.svelte'
  import Settings from './routes/Settings.svelte'
  import { swipe } from './lib/gestures.js'
  
  const store = useTasks()
  const theme = useTheme()
  
  let currentDate = $state(new Date().toISOString().split('T')[0])
  let currentScreen = $state('today')
  let editingTask = $state(null)
  
  // Long press состояние
  let longPressTimer = $state(null)
  let longPressTriggered = $state(false)
  
  onMount(() => {
    store.load()
  })
  
  function formatDate(dateString) {
    const date = new Date(dateString)
    const options = { weekday: 'long', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-US', options).toUpperCase()
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
    currentDate = date
    currentScreen = 'today'
  }
  
  // ===== LONG PRESS ЛОГИКА =====
  function handleTouchStart(task) {
    longPressTriggered = false
    longPressTimer = setTimeout(() => {
      longPressTriggered = true
      // Вибрация на поддерживаемых устройствах
      if (navigator.vibrate) navigator.vibrate(30)
      openEditTask(task)
    }, 500)
  }
  
  function handleTouchEnd(task) {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    
    // Если long press не сработал — это обычный тап
    if (!longPressTriggered) {
      if (!task.completedDates.includes(currentDate)) {
        store.toggleComplete(task.id)
      }
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
  
  // Для десктопа — обычный клик
  function handleClick(e, task) {
    // Игнорируем touch events (они уже обработаны)
    if (e.pointerType === 'touch') return
    
    if (!task.completedDates.includes(currentDate)) {
      store.toggleComplete(task.id)
    }
  }
  
  function swipeLeft() {
    if (currentScreen === 'calendar') currentScreen = 'today'
    else if (currentScreen === 'today') currentScreen = 'input'
  }
  
  function swipeRight() {
    if (currentScreen === 'input') currentScreen = 'today'
    else if (currentScreen === 'today') currentScreen = 'calendar'
  }
  
  function goTo(screen) {
    currentScreen = screen
  }
</script>

<div use:swipe={{ onSwipeLeft: swipeLeft, onSwipeRight: swipeRight, threshold: 80 }}>
  {#if currentScreen === 'calendar'}
    <Calendar onSelectDate={handleDateSelect} />
  {:else if currentScreen === 'today'}
    <div class="min-h-screen bg-background text-foreground p-8 flex flex-col">
      <header class="mb-12 flex justify-between items-start">
        <button 
          onclick={() => currentScreen = 'calendar'}
          class="text-sm font-normal opacity-40 hover:opacity-100 transition-opacity"
        >
          {formatDate(currentDate)}
        </button>
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
          <button onclick={openNewTask} class="text-4xl font-bold opacity-40 hover:opacity-100 transition-opacity">
            CLEAR MIND
          </button>
        {:else}
          <ul class="space-y-6">
            {#each store.getTasksForDate(currentDate) as task (task.id)}
              <li>
                <button
                  class="w-full text-left text-4xl font-bold transition-all duration-300 active:opacity-50"
                  class:line-through={task.completedDates.includes(currentDate)}
                  class:opacity-30={task.completedDates.includes(currentDate)}
                  class:blur-sm={task.isDissolving}
                  class:opacity-0={task.isDissolving}
                  class:scale-95={task.isDissolving}
                  ontouchstart={() => handleTouchStart(task)}
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
            TAP TO COMPLETE · HOLD TO EDIT
          </p>
        {/if}
      </main>
      
      <footer class="mt-8 flex justify-between items-center">
        <button 
          onclick={() => currentScreen = 'settings'}
          class="text-sm font-normal opacity-30 hover:opacity-100 transition-opacity"
        >
          ⚙
        </button>
        
        <div class="flex justify-center gap-3">
          <button 
            onclick={() => goTo('calendar')}
            class="w-3 h-3 rounded-full transition-opacity"
            class:bg-foreground={currentScreen === 'calendar'}
            class:opacity-20={currentScreen !== 'calendar'}
            aria-label="Calendar"
          ></button>
          <button 
            onclick={() => goTo('today')}
            class="w-3 h-3 rounded-full transition-opacity"
            class:bg-foreground={currentScreen === 'today'}
            class:opacity-20={currentScreen !== 'today'}
            aria-label="Today"
          ></button>
          <button 
            onclick={() => goTo('input')}
            class="w-3 h-3 rounded-full transition-opacity"
            class:bg-foreground={currentScreen === 'input'}
            class:opacity-20={currentScreen !== 'input'}
            aria-label="Add task"
          ></button>
        </div>
        
        <div class="w-6"></div>
      </footer>
    </div>
  {:else if currentScreen === 'input'}
    <Input task={editingTask} onDone={handleInputDone} />
  {:else if currentScreen === 'settings'}
    <Settings onClose={() => currentScreen = 'today'} />
  {/if}
</div>