import { usePersistentStorage } from '~/composables/usePersistentStorage'

export type ColorScheme = 'light' | 'dark'
export type ThemePreference = 'system' | ColorScheme

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Like next-themes: switch colors in one frame instead of letting every transition animate the change. */
function withoutTransitions(change: () => void) {
  const style = document.createElement('style')
  style.textContent = ':not([data-part="indicator"]), ::before, ::after { transition: none !important; }'
  document.head.appendChild(style)
  change()
  void getComputedStyle(document.body).opacity
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()))
}

export function useTheme() {
  const stored = usePersistentStorage<ThemePreference>('theme', {
    fallback: 'system',
    parse: (raw) => (raw === 'light' || raw === 'dark' ? raw : 'system'),
    serialize: (preference) => (preference === 'system' ? null : preference),
  })
  const scheme = useState<ColorScheme>('color-scheme', () => 'light')

  function apply() {
    const preference = stored.value.value
    const next = preference === 'system' ? (matchMedia(DARK_QUERY).matches ? 'dark' : 'light') : preference
    scheme.value = next
    if (document.documentElement.dataset.theme === next) return
    withoutTransitions(() => (document.documentElement.dataset.theme = next))
  }

  function setPreference(next: ThemePreference) {
    stored.value.value = next
    apply()
  }

  function sync() {
    stored.restore()
    apply()
    const media = matchMedia(DARK_QUERY)
    const onChange = () => stored.value.value === 'system' && apply()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }

  return { preference: stored.value, scheme, setPreference, sync }
}
