<script setup lang="ts">
import { computed, ref, shallowRef, toRef, watch } from 'vue'
import * as s from './UsagePlayground.css'
import type { DesignSystemIndex } from '~/utils/design-system'
import type { Finding } from '~/utils/token-inspection'
import { usePersistentStorage } from '~/composables/usePersistentStorage'
import { useTokenPlayground } from '~/composables/useTokenPlayground'

const props = defineProps<{ ds: DesignSystemIndex }>()

const playground = useTokenPlayground(toRef(() => props.ds))

function starter(ds: DesignSystemIndex): string {
  const pick = (category: string, preferred: string[]) => {
    const names = ds.view(category).map((t) => t.name)
    return preferred.find((name) => names.includes(name)) ?? names[Math.floor(names.length / 2)] ?? ''
  }
  const fg = pick('colors', ['fg', 'fg.default', 'text', 'black'])
  const bg = pick('colors', ['bg.surface', 'bg', 'bg.default', 'white'])
  const space = pick('spacing', ['4', 'md'])
  const radius = pick('radii', ['l2', 'md', 'lg'])
  const size = pick('fontSizes', ['sm', 'md'])
  return [
    "import { css } from 'styled-system/css'",
    '',
    'export const card = css({',
    `  color: '${fg}',`,
    `  bg: '${bg}',`,
    `  p: '${space}',`,
    `  rounded: '${radius}',`,
    `  fontSize: '${size}',`,
    '})',
    '',
  ].join('\n')
}

const stored = usePersistentStorage<string>('usage-playground', {
  fallback: '',
  parse: (raw) => raw ?? '',
  serialize: (value) => value || null,
})
stored.restore()

const source = ref(stored.value.value || starter(props.ds))
watch(source, (value) => (stored.value.value = value))

const findings = shallowRef<Finding[]>([])
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  [source, playground.status],
  ([code]) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const result = playground.inspect(code)
      // Mid-edit code often doesn't parse; keep the last good result instead of flashing an empty panel.
      if (result && !result.file.diagnostics.some((d) => d.severity === 'error')) findings.value = result.findings
    }, 150)
  },
  { immediate: true },
)

type Change = { from: number; to: number; insert: string }
const editor = ref<{ replace: (changes: Change[]) => void; select: (from: number, to: number) => void } | null>(null)

const reset = () => (source.value = starter(props.ds))

const statusLabel = computed(() =>
  playground.status.value === 'loading'
    ? 'Starting the Panda compiler…'
    : playground.status.value === 'error'
      ? `The compiler couldn't start: ${playground.error.value}`
      : '',
)
</script>

<template>
  <div :class="s.layout">
    <EditorCard title="playground.tsx">
      <template #status>
        <span v-if="statusLabel" :class="s.status">{{ statusLabel }}</span>
      </template>
      <template #actions>
        <button type="button" :class="s.reset" @click="reset">Reset</button>
      </template>
      <ClientOnly>
        <CodeEditor
          ref="editor"
          v-model="source"
          :ds="ds"
          :findings="findings"
          :category-at="playground.categoryAt"
          :class="s.editor"
        />
        <template #fallback>
          <pre :class="s.editorFallback">{{ source }}</pre>
        </template>
      </ClientOnly>
    </EditorCard>

    <UsagePanel
      :ds="ds"
      :findings="findings"
      @fix="(changes) => editor?.replace(changes)"
      @reveal="(from, to) => editor?.select(from, to)"
    />
  </div>
</template>
