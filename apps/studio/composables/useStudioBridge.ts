import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { UsageReport } from '@pandacss/compiler-shared'

export type BridgeMessage =
  | { type: 'system'; spec: string }
  | { type: 'report'; report: UsageReport }
  | { type: 'sources'; files: { path: string; text: string }[] }
  | { type: 'source'; path: string; text: string }
  | { type: 'removed'; path: string }
  | { type: 'status'; live: boolean }

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

/** Receives a project from `panda studio`, whose local page frames Studio and relays CLI events. */
export function useStudioBridge(onMessage: (message: BridgeMessage) => void) {
  const connected = ref(false)
  const live = ref(false)

  const listen = (event: MessageEvent) => {
    if (event.source !== window.parent || !LOCAL_ORIGIN.test(event.origin)) return
    const message = event.data as BridgeMessage
    connected.value = true
    live.value = message.type === 'status' ? message.live : true
    if (message.type !== 'status') onMessage(message)
  }

  onMounted(() => {
    if (window.parent === window) return
    window.addEventListener('message', listen)
    window.parent.postMessage({ type: 'ready' }, '*')
  })

  onBeforeUnmount(() => window.removeEventListener('message', listen))

  return { connected, live }
}
