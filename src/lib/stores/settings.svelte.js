const STORAGE_KEY = 'planner-settings'

const DEFAULTS = {
  fontSize: 'md',      // sm | md | lg | xl
  alignment: 'left',   // left | center | right
  border: 'normal',    // narrow | normal | wide
}

let settings = $state(loadSettings())

function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveSettings() {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function applySettings() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  
  // Размер шрифта задач
  const fontSizes = {
    sm: '24px',
    md: '36px',
    lg: '48px',
    xl: '60px',
  }
  root.style.setProperty('--task-font-size', fontSizes[settings.fontSize])
  
  // Выравнивание
  root.style.setProperty('--list-alignment', settings.alignment)
  
  // Border (горизонтальные отступы)
  const borders = {
    narrow: 'clamp(48px, 15vw, 200px)',
    normal: 'clamp(24px, 6vw, 80px)',
    wide: '16px',
  }
  root.style.setProperty('--list-padding-x', borders[settings.border])
}

function update(key, value) {
  settings[key] = value
  saveSettings()
  applySettings()
}

function reset() {
  settings = { ...DEFAULTS }
  saveSettings()
  applySettings()
}

// Применяем сразу
applySettings()

export function useSettings() {
  return {
    get fontSize() { return settings.fontSize },
    get alignment() { return settings.alignment },
    get border() { return settings.border },
    get all() { return settings },
    update,
    reset,
  }
}