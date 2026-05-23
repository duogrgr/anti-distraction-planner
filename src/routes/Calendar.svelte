<script>
  import { useTasks } from '../lib/stores/tasks.svelte.js'
  
  let { onSelectDate = () => {} } = $props()
  
  const store = useTasks()
  
  let viewDate = $state(new Date())
  let selectedDate = $state(new Date().toISOString().split('T')[0])
  
  const today = $derived(new Date().toISOString().split('T')[0])
  
  const year = $derived(viewDate.getFullYear())
  const month = $derived(viewDate.getMonth())
  
  const monthName = $derived(
    viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  )
  
  const daysInMonth = $derived(new Date(year, month + 1, 0).getDate())
  const firstDayOfMonth = $derived(new Date(year, month, 1).getDay())
  
  const days = $derived.by(() => {
    const days = []
    
    // Пустые ячейки до первого дня месяца
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const tasksForDay = store.getTasksForDate(date)
      days.push({
        day,
        date,
        hasTasks: tasksForDay.length > 0,
        completedTasks: tasksForDay.filter(t => t.completedDates.includes(date)).length,
        totalTasks: tasksForDay.length,
      })
    }
    
    return days
  })
  
  function prevMonth() {
    viewDate = new Date(year, month - 1, 1)
  }
  
  function nextMonth() {
    viewDate = new Date(year, month + 1, 1)
  }
  
  function selectDay(date) {
    selectedDate = date
    onSelectDate(date)
  }
</script>

<div class="min-h-screen bg-background text-foreground p-8 flex flex-col">
  <header class="mb-8 flex items-center justify-between">
    <button 
      onclick={prevMonth}
      class="text-3xl font-bold opacity-40 hover:opacity-100 transition-opacity"
    >
      ‹
    </button>
    <h1 class="text-sm font-normal opacity-40">{monthName}</h1>
    <button 
      onclick={nextMonth}
      class="text-3xl font-bold opacity-40 hover:opacity-100 transition-opacity"
    >
      ›
    </button>
  </header>
  
  <div class="grid grid-cols-7 gap-2 mb-4">
    {#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
      <div class="text-xs font-normal opacity-30 text-center">{day}</div>
    {/each}
  </div>
  
  <div class="grid grid-cols-7 gap-2 flex-1">
    {#each days as day}
      {#if day === null}
        <div></div>
      {:else}
        <button
          onclick={() => selectDay(day.date)}
          class="relative aspect-square flex items-center justify-center text-lg font-bold transition-all"
          class:opacity-40={day.date !== selectedDate && day.date !== today}
          class:bg-foreground={day.date === selectedDate}
          class:text-background={day.date === selectedDate}
          class:border-2={day.date === today && day.date !== selectedDate}
          class:border-current={day.date === today && day.date !== selectedDate}
        >
          {day.day}
          
          {#if day.hasTasks}
            <div 
              class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current"
              class:opacity-50={day.completedTasks === day.totalTasks}
            ></div>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
</div>