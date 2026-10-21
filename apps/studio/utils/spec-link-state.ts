import { ref, shallowRef } from 'vue'

export const linkLoading = ref<string | null>(null)

export const linkPending = shallowRef<Promise<boolean> | null>(null)
