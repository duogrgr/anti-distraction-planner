const STORAGE_KEY = 'theme-preference'

let mode = $state(loadPreference()) // 'light' | 'dark' | 'auto'
let systemDark = $state(false)

// Следим за системной темой
if (typeof window !== 'undefined') {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark = mql.matches
  mql.addEventListener('change', (e) => {
    systemDark = e.matches
    applyTheme()
  })
}

function loadPreference() {
  if (typeof window === 'undefined') return 'auto'
  return localStorage.getItem(STORAGE_KEY) || 'auto'
}

function savePreference() {
  if (typeof window === 'undefined') return
  if (mode === 'auto') {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, mode)
  }
}

function applyTheme() {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  
  let isDark = false
  if (mode === 'dark') {
    isDark = true
  } else if (mode === 'light') {
    isDark = false
  } else {
    isDark = systemDark
  }
  
  html.setAttribute('data-theme', isDark ? 'dark' : 'light')
  
  // Для PWA и status bar
  const themeColor = isDark ? '#1a1a1a' : '#ffffff'
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = themeColor
}

function cycle() {
  if (mode === 'auto') mode = 'light'
  else if (mode === 'light') mode = 'dark'
  else mode = 'auto'
  savePreference()
  applyTheme()
}

// Применяем сразу
applyTheme()

export function useTheme() {
  return {
    get mode() { return mode },
    get isDark() {
      if (mode === 'dark') return true
      if (mode === 'light') return false
      return systemDark
    },
    get label() {
      if (mode === 'auto') return 'AUTO'
      if (mode === 'light') return 'LIGHT'
      return 'DARK'
    },
    get icon() {
      if (mode === 'auto') return '◐'
      if (mode === 'light') return '○'
      return '●'
    },
    cycle,
  }
}