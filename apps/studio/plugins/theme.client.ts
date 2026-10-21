import { useTheme } from '~/composables/useTheme'

export default defineNuxtPlugin(() => {
  useTheme().sync()
})
