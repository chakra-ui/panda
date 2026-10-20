<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import * as s from './FileTree.css'
import { buildTree, isIssue, type ScanFile, type TreeNode } from '~/utils/project-scan'

const props = defineProps<{
  files: ScanFile[]
  active?: string
  to: (path: string) => RouteLocationRaw
}>()

const query = ref('')
const byIssues = ref(false)
const tree = computed(() => buildTree(props.files))

const ancestors = (path: string) =>
  path
    .split('/')
    .slice(0, -1)
    .map((_, i, parts) => parts.slice(0, i + 1).join('/'))

const open = ref(new Set<string>())
watch(
  tree,
  (nodes) => {
    const all = props.files.length <= 30
    const next = new Set<string>()
    const visit = (list: TreeNode[], depth: number) => {
      for (const node of list) {
        if (node.file) continue
        if (all || depth === 0) next.add(node.path)
        visit(node.children, depth + 1)
      }
    }
    visit(nodes, 0)
    open.value = next
  },
  { immediate: true },
)
watch(
  () => props.active,
  (path) => path && ancestors(path).forEach((dir) => open.value.add(dir)),
  { immediate: true },
)

function toggle(path: string) {
  const next = new Set(open.value)
  if (!next.delete(path)) next.add(path)
  open.value = next
}

type Row = { node: TreeNode; depth: number; label: string }

const issueCount = (file: ScanFile) => file.findings.filter(isIssue).length

const rows = computed<Row[]>(() => {
  const needle = query.value.trim().toLowerCase()
  if (needle || byIssues.value) {
    return props.files
      .filter((f) => !needle || f.path.toLowerCase().includes(needle))
      .filter((f) => !byIssues.value || issueCount(f) > 0)
      .toSorted((a, b) => (byIssues.value ? issueCount(b) - issueCount(a) : 0) || a.path.localeCompare(b.path))
      .map((file) => ({
        node: { name: file.path, path: file.path, file, issues: issueCount(file), children: [] },
        depth: 0,
        label: file.path,
      }))
  }
  const out: Row[] = []
  const walk = (list: TreeNode[], depth: number) => {
    for (const node of list) {
      out.push({ node, depth, label: node.name })
      if (!node.file && open.value.has(node.path)) walk(node.children, depth + 1)
    }
  }
  walk(tree.value, 0)
  return out
})
</script>

<template>
  <div :class="s.root">
    <div v-if="files.length > 8" :class="s.tools">
      <input v-model="query" type="search" placeholder="Filter files" aria-label="Filter files" :class="s.filter" />
      <button
        type="button"
        :class="s.sort"
        :aria-pressed="byIssues"
        title="Show only files with issues, most first"
        @click="byIssues = !byIssues"
      >
        With issues
      </button>
    </div>

    <ul :class="s.list" role="list">
      <li v-for="row in rows" :key="row.node.path">
        <NuxtLink
          v-if="row.node.file"
          :to="to(row.node.path)"
          :class="s.row"
          :style="{ '--depth': row.depth }"
          :aria-current="active === row.node.path ? 'page' : undefined"
          :title="row.node.path"
        >
          <span :class="s.name" :data-path="row.label !== row.node.name || undefined">{{ row.label }}</span>
          <span v-if="row.node.issues" :class="s.count">{{ row.node.issues }}</span>
        </NuxtLink>
        <button
          v-else
          type="button"
          :class="[s.row, s.folder]"
          :style="{ '--depth': row.depth }"
          :aria-expanded="open.has(row.node.path)"
          @click="toggle(row.node.path)"
        >
          <Icon name="chevronRight" :size="12" :class="s.chevron" />
          <span :class="s.name">{{ row.label }}</span>
        </button>
      </li>
      <li v-if="!rows.length" :class="s.empty">No files match.</li>
    </ul>
  </div>
</template>
