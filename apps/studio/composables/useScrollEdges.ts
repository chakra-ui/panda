import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Whether a scroll box has hidden content above or below, so edges can fade only when there's more to see. */
export function useScrollEdges(target: Ref<HTMLElement | null | undefined>) {
  const top = ref(false)
  const bottom = ref(false)

  const update = () => {
    const el = target.value
    if (!el) return
    top.value = el.scrollTop > 1
    bottom.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1
  }

  let observer: ResizeObserver | undefined

  onMounted(() => {
    const el = target.value
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    observer = new ResizeObserver(update)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    update()
  })

  onBeforeUnmount(() => {
    target.value?.removeEventListener('scroll', update)
    observer?.disconnect()
  })

  return { top, bottom, update }
}
