import { ref, shallowRef, watch } from 'vue'
import type { UsageReport } from '@pandacss/compiler-shared'
import { index, parseSpec, type DesignSystemIndex } from '~/utils/design-system'

export type LiveMessage =
  | { type: 'system'; spec: string }
  | { type: 'report'; report: UsageReport }
  | { type: 'sources'; files: { path: string; text: string }[] }
  | { type: 'source'; path: string; text: string }
  | { type: 'removed'; path: string }
  | { type: 'status'; live: boolean }

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
/** How long a framed Studio waits for `panda studio` before falling back to what's saved in the browser. */
const CONNECT_TIMEOUT_MS = 3000

const state = {
  /** Framed and still waiting for the first message from `panda studio`. */
  pending: ref(false),
  connected: ref(false),
  live: ref(false),
  ds: shallowRef<DesignSystemIndex | null>(null),
  report: shallowRef<UsageReport | null>(null),
  sources: shallowRef(new Map<string, string>()),
}

/** Resolves once a framed Studio has heard from `panda studio`, or given up waiting. */
function settled(): Promise<void> {
  if (!state.pending.value) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = watch(state.pending, (pending) => {
      if (pending) return
      stop()
      resolve()
    })
  })
}

/** The project `panda studio` streams in, shared by every page. */
export function useLiveStudio() {
  return { ...state, settled }
}

function receive(message: LiveMessage) {
  if (message.type === 'status') {
    state.live.value = message.live
    return
  }
  state.live.value = true
  if (message.type === 'system') {
    const result = parseSpec(message.spec)
    if (result.ok) state.ds.value = index(result.spec)
  }
  if (message.type === 'report') state.report.value = message.report
  if (message.type === 'sources') state.sources.value = new Map(message.files.map((f) => [f.path, f.text]))
  if (message.type === 'source' || message.type === 'removed') {
    const next = new Map(state.sources.value)
    if (message.type === 'source') next.set(message.path, message.text)
    else next.delete(message.path)
    state.sources.value = next
  }
}

/** Listens for `panda studio`, whose local page frames Studio and relays CLI events. */
export function startLiveStudio() {
  if (window.parent === window) return
  state.pending.value = true
  const timeout = setTimeout(() => (state.pending.value = false), CONNECT_TIMEOUT_MS)

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || !LOCAL_ORIGIN.test(event.origin)) return
    clearTimeout(timeout)
    state.pending.value = false
    state.connected.value = true
    receive(event.data as LiveMessage)
  })
  window.parent.postMessage({ type: 'ready' }, '*')
}
