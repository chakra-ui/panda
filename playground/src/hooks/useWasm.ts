import { loadWasm } from '@/src/lib/compiler/load-wasm'
import type { WasmModule } from '@pandacss/compiler-wasm/web'
import { useEffect, useState } from 'react'

/** Load the wasm engine once on mount; `null` until ready. */
export function useWasm(): WasmModule | null {
  const [mod, setMod] = useState<WasmModule | null>(null)

  useEffect(() => {
    let active = true
    loadWasm().then((m) => {
      if (active) setMod(m)
    })
    return () => {
      active = false
    }
  }, [])

  return mod
}
