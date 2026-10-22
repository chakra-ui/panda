import { ref, shallowRef, watch, type Ref } from 'vue'
import type { InspectingCompiler } from '~/utils/analyze-compiler'
import type { DesignSystemIndex } from '~/utils/design-system'
import { canonicalProp, inspectSnippet, tokenCategoryOf, type SnippetInspection } from '~/utils/token-inspection'

type Spec = Parameters<typeof tokenCategoryOf>[0]

const KEY_BEFORE_STRING = /([A-Za-z_$][\w$]*)\s*[:=]\s*\{?\s*['"`][^'"`]*$/

export function useTokenPlayground(ds: Ref<DesignSystemIndex | null>) {
  const compiler = shallowRef<InspectingCompiler | null>(null)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref('')
  const names = new Map<string, string[]>()

  watch(
    ds,
    async (system) => {
      names.clear()
      compiler.value = null
      if (!system || !import.meta.client) return
      status.value = 'loading'
      try {
        const { createCompilerFromSpec } = await import('~/utils/analyze-compiler')
        compiler.value = await createCompilerFromSpec(system.spec)
        status.value = 'ready'
      } catch (cause) {
        status.value = 'error'
        error.value = cause instanceof Error ? cause.message : String(cause)
      }
    },
    { immediate: true },
  )

  const tokenNames = (category: string) => {
    let list = names.get(category)
    if (!list) {
      list = ds.value?.view(category).map((t) => t.name) ?? []
      names.set(category, list)
    }
    return list
  }

  function inspect(source: string): SnippetInspection | null {
    return compiler.value ? inspectSnippet(compiler.value, source, tokenNames) : null
  }

  function categoryAt(source: string, offset: number): string | undefined {
    const instance = compiler.value
    if (!instance) return undefined
    const spec = instance.spec() as Spec
    const before = source.slice(0, offset)
    const line = before.slice(before.lastIndexOf('\n') + 1)
    const typed = line.match(KEY_BEFORE_STRING)
    if (!typed) return undefined

    const byte = new TextEncoder().encode(before).length
    const entry = instance
      .inspectFileSource('playground.tsx', source)
      .styleEntries.filter((e) => e.kind === 'utility' && e.span.start <= byte && byte <= e.span.end)
      .sort((a, b) => a.span.end - a.span.start - (b.span.end - b.span.start))[0]
    const prop = entry ? entry.canonicalName ?? entry.name : canonicalProp(spec, typed[1])
    return tokenCategoryOf(spec, prop)
  }

  return { status, error, inspect, categoryAt, tokenNames }
}
