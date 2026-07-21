const STORAGE_KEY = 'panda-prose-dark'

export function readDarkPreference(): boolean {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored != null) return stored === '1'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyDarkClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  window.localStorage.setItem(STORAGE_KEY, dark ? '1' : '0')
}
