<script setup lang="ts">
import { computed } from 'vue'
import * as s from './ReportFileView.css'
import { button, frame } from 'styled-system/recipes'
import type { useProjectScan } from '~/composables/useProjectScan'
import type { DesignSystemIndex } from '~/utils/design-system'
import { isIssue, type ScanFile } from '~/utils/project-scan'

const props = defineProps<{
  ds: DesignSystemIndex
  file: ScanFile
  scanner: ReturnType<typeof useProjectScan>
}>()

const classes = frame()

const issues = computed(() =>
  props.file.findings
    .filter(isIssue)
    .map((issue) =>
      issue.kind === 'unknown'
        ? { ...issue, tone: 'danger', label: 'Not in your system', replacement: issue.suggestion }
        : { ...issue, tone: 'warning', label: 'Hard-coded', replacement: issue.match },
    ),
)

const used = computed(() => {
  const counts = new Map<string, number>()
  for (const f of props.file.findings) if (f.kind === 'token') counts.set(f.path, (counts.get(f.path) ?? 0) + 1)
  return [...counts].map(([path, uses]) => ({ path, uses })).toSorted((a, b) => b.uses - a.uses)
})

const editorLink = (line: number, column = 1) => {
  const abs = props.file.absPath
  if (!abs || !/^(\/|[A-Za-z]:)/.test(abs)) return undefined
  return `vscode://file${abs.startsWith('/') ? '' : '/'}${abs}:${line}:${column}`
}

const swatch = (path: string) =>
  path.startsWith('colors.') || path.startsWith('gradients.') ? props.ds.resolve(path)?.value : undefined
</script>

<template>
  <div :class="s.root">
    <div :class="classes.root">
      <div :class="[classes.body, s.body]">
        <p v-if="!issues.length" :class="s.empty">No issues. Every value in this file comes from your tokens.</p>
        <ul v-else :class="s.list">
          <li v-for="(issue, i) in issues" :key="i" :class="s.row">
            <span :class="s.position">{{ issue.column ? `${issue.line}:${issue.column}` : issue.line }}</span>
            <span :class="s.dot" :data-tone="issue.tone" aria-hidden="true" />
            <code :class="s.value">{{ issue.value }}</code>
            <span :class="s.meta">{{ issue.prop }} · {{ issue.label }}</span>
            <code v-if="issue.replacement" :class="s.replacement">→ {{ issue.replacement }}</code>
            <a
              v-if="editorLink(issue.line, issue.column)"
              :href="editorLink(issue.line, issue.column)"
              :class="[button({ variant: 'ghost', size: 'icon' }), s.open]"
              :aria-label="`Open line ${issue.line} in VS Code`"
              title="Open in VS Code"
            >
              <Icon name="arrowUpRight" :size="14" />
            </a>
          </li>
        </ul>

        <div v-if="used.length" :class="s.used">
          <span :class="s.usedLabel">Tokens</span>
          <code v-for="t in used" :key="t.path" :class="s.chip" :title="`${t.path} · ×${t.uses}`">
            <i v-if="swatch(t.path)" :class="s.swatch" :style="{ background: swatch(t.path) }" aria-hidden="true" />
            {{ t.path }}<span v-if="t.uses > 1" :class="s.chipCount">×{{ t.uses }}</span>
          </code>
        </div>
      </div>

      <div :class="classes.bar">
        <Icon name="code" :size="13" />
        <span>Add your source folder to see these lines in context.</span>
        <button
          v-if="scanner.canPickFolder()"
          type="button"
          :class="[button({ size: 'sm' }), s.attach]"
          @click="scanner.attach()"
        >
          Add folder
        </button>
        <label v-else :class="[button({ size: 'sm' }), s.attach]">
          Add folder
          <input type="file" webkitdirectory multiple hidden @change="scanner.onAttach" />
        </label>
      </div>
    </div>

    <p v-if="scanner.error.value" role="alert" :class="s.error">{{ scanner.error.value }}</p>
  </div>
</template>
