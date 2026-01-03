import { atom } from 'nanostores'

const THEME_STORAGE_KEY = 'panda-studio-theme'

// Store for the current theme
export const currentThemeStore = atom<string | undefined>(undefined)

// Get theme from localStorage only (client-side only)
const getInitialTheme = (): string | undefined => {
  if (typeof window === 'undefined') return undefined

  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme || undefined
  } catch {
    // Handle localStorage access errors
    return undefined
  }
}

// Initialize theme from localStorage
if (typeof window !== 'undefined') {
  const theme = getInitialTheme()
  currentThemeStore.set(theme)
}

// Update localStorage when theme changes (client-side only)
currentThemeStore.listen((value) => {
  if (typeof window !== 'undefined') {
    try {
      if (value) {
        localStorage.setItem(THEME_STORAGE_KEY, value)
      } else {
        localStorage.removeItem(THEME_STORAGE_KEY)
      }
    } catch {
      // Handle localStorage access errors
    }
  }
})
