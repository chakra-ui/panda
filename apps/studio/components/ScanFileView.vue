<script setup lang="ts">
import { nextTick, ref, shallowRef, watch } from 'vue'
import * as s from './ScanFileView.css'
import type { DesignSystemIndex } from '~/utils/design-system'
import { formatSource } from '~/utils/format-source'
import type { ScanFile } from '~/utils/project-scan'
import { inspectSource, type Finding } from '~/utils/token-inspection'

const props = defineProps<{ ds: DesignSystemIndex; file: ScanFile; line?: number }>()

const editor = ref<{ select: (from: number, to: number) => void } | null>(null)

/** What the editor shows: the file reformatted to fit, with findings re-read from that text. */
const shown = shallowRef<{ source: string; findings: Finding[] }>({ source: '', findings: [] })

const tokenNames = (category: string) => props.ds.view(category).map((t) => t.name)

watch(
  () => props.file,
  async (file) => {
    shown.value = { source: file.source ?? '', findings: file.findings }
    if (!file.source) return
    const formatted = await formatSource(file.path, file.source)
    if (!formatted || formatted === file.source || props.file !== file) return
    const { createCompilerFromSpec } = await import('~/utils/analyze-compiler')
    const compiler = await createCompilerFromSpec(props.ds.spec)
    const { findings } = inspectSource(compiler, file.path, formatted, tokenNames)
    // Same styles in the same order; anything else means formatting changed meaning, so keep the original.
    if (props.file === file && findings.length === file.findings.length) shown.value = { source: formatted, findings }
  },
  { immediate: true },
)

watch(
  [shown, () => props.line, editor],
  async () => {
    if (!props.line || !editor.value) return
    await nextTick()
    const original = props.file.findings
    const onLine = original.filter((f) => f.line === props.line && f.from >= 0)
    const target = onLine.find((f) => f.kind !== 'token') ?? onLine[0]
    const match = target && shown.value.findings[original.indexOf(target)]
    if (match) editor.value.select(match.from, match.to)
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="file.source" :class="s.layout">
    <EditorCard :title="file.path">
      <template #actions>
        <span :class="s.readonly">Read-only</span>
      </template>
      <ClientOnly>
        <CodeEditor
          ref="editor"
          :model-value="shown.source"
          :ds="ds"
          :findings="shown.findings"
          read-only
          :class="s.editor"
        />
      </ClientOnly>
    </EditorCard>
    <UsagePanel :ds="ds" :findings="shown.findings" read-only @reveal="(from, to) => editor?.select(from, to)" />
  </div>

  <div v-else :class="s.reportOnly">
    <p :class="s.notice">
      This report lists lines, not code. Scan the project folder to see the file with its issues marked.
    </p>
    <UsagePanel :ds="ds" :findings="file.findings" read-only />
  </div>
</template>
