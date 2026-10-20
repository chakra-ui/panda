<script setup lang="ts">
import { computed, ref } from 'vue'
import { max } from 'd3-array'
import { scaleLinear, scaleSqrt } from 'd3-scale'
import type { RouteLocationRaw } from 'vue-router'
import * as s from './ScanOverview.css'
import type { DesignSystemIndex } from '~/utils/design-system'
import { orderCategories } from '~/utils/design-system'
import { summarizeScan, type ProjectScan, type ScanSummary } from '~/utils/project-scan'

const props = defineProps<{
  ds: DesignSystemIndex
  scan: ProjectScan
  to: (path: string, line?: number) => RouteLocationRaw
}>()

const ISSUE_LIMIT = 30

const summary = computed(() => {
  const categories = orderCategories(
    props.ds.categories().map((type) => ({ type, count: props.ds.categoryPaths(type).length })),
  ).map((c) => c.type)
  return summarizeScan(props.scan, props.ds, categories)
})

const coverage = computed(() =>
  summary.value.total ? Math.round((summary.value.used / summary.value.total) * 100) : 0,
)

const shade = computed(() => {
  const most = max(summary.value.categories.flatMap((c) => c.tokens.map((t) => t.uses))) ?? 1
  return scaleSqrt()
    .domain([1, Math.max(most, 2)])
    .range([0.35, 1])
    .clamp(true)
})

const barWidth = computed(() =>
  scaleLinear()
    .domain([0, summary.value.top[0]?.uses ?? 1])
    .range([0, 100]),
)

const topGroups = computed(() => {
  const groups = new Map<string, { category: string; uses: number; tokens: ScanSummary['top'] }>()
  for (const t of summary.value.top) {
    const group = groups.get(t.category) ?? { category: t.category, uses: 0, tokens: [] }
    group.uses += t.uses
    group.tokens.push(t)
    groups.set(t.category, group)
  }
  return [...groups.values()].toSorted((a, b) => b.uses - a.uses)
})

const showAllIssues = ref(false)
const issues = computed(() => (showAllIssues.value ? summary.value.issues : summary.value.issues.slice(0, ISSUE_LIMIT)))

const swatch = (category: string, name: string) =>
  category === 'colors' || category === 'gradients' ? props.ds.resolve(`${category}.${name}`)?.value : undefined

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
</script>

<template>
  <div :class="s.root">
    <StatGrid
      :items="[
        { label: 'Tokens used', value: `${summary.used} / ${summary.total}` },
        { label: 'Coverage', value: `${coverage}%` },
        { label: 'Unknown', value: summary.unknown, tone: summary.unknown ? 'danger' : undefined },
        { label: 'Hard-coded', value: summary.raw, tone: summary.raw ? 'warning' : undefined },
      ]"
    />

    <section :class="s.section">
      <header :class="s.sectionHeader">
        <h2 :class="s.heading">Token coverage</h2>
        <span :class="s.legend">
          <i :class="s.cell" aria-hidden="true" /> Unused
          <i :class="s.cell" data-used style="opacity: 0.4" aria-hidden="true" />
          <i :class="s.cell" data-used aria-hidden="true" /> Used more
        </span>
      </header>
      <div :class="s.waffle">
        <details v-for="c in summary.categories" :key="c.type" :class="s.category">
          <summary :class="s.categoryRow">
            <span :class="s.categoryName">{{ c.type }}</span>
            <span :class="s.cells" :aria-label="`${c.used} of ${c.tokens.length} ${c.type} used`" role="img">
              <i
                v-for="t in c.tokens"
                :key="t.name"
                :class="s.cell"
                :data-used="t.uses ? '' : undefined"
                :style="t.uses ? { opacity: shade(t.uses) } : undefined"
                :title="`${t.name} · ${plural(t.uses, 'use')}`"
              />
            </span>
            <span :class="s.categoryCount">{{ c.used }}/{{ c.tokens.length }}</span>
          </summary>
          <div :class="s.unused">
            <template v-if="c.used < c.tokens.length">
              <span :class="s.unusedLabel">Never used</span>
              <code v-for="t in c.tokens.filter((t) => !t.uses)" :key="t.name" :class="s.chip">{{ t.name }}</code>
            </template>
            <span v-else :class="s.unusedLabel">All {{ c.tokens.length }} {{ c.type }} are used.</span>
          </div>
        </details>
      </div>
    </section>

    <div :class="s.columns">
      <section :class="s.section">
        <h2 :class="s.heading">Most used tokens</h2>
        <p v-if="!summary.top.length" :class="s.empty">None of these files use a token yet.</p>
        <div :class="s.groups">
          <div v-for="g in topGroups" :key="g.category" :class="s.group">
            <h3 :class="s.groupHeading">
              {{ g.category }} <span :class="s.groupCount">{{ plural(g.uses, 'use') }}</span>
            </h3>
            <ol :class="s.bars">
              <li v-for="t in g.tokens" :key="t.path" :class="s.bar" :title="`${t.path} · ${plural(t.uses, 'use')}`">
                <i :class="s.barFill" :style="{ width: `${barWidth(t.uses)}%` }" aria-hidden="true" />
                <i
                  v-if="swatch(t.category, t.name)"
                  :class="s.swatch"
                  :style="{ background: swatch(t.category, t.name) }"
                  aria-hidden="true"
                />
                <code :class="s.barLabel">{{ t.name }}</code>
                <span :class="s.barValue">{{ t.uses }}</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section :class="s.section">
        <h2 :class="s.heading">Issues</h2>
        <p v-if="!summary.issues.length" :class="s.empty">No issues. Every value comes from your tokens.</p>
        <ul :class="s.issues">
          <li v-for="(issue, i) in issues" :key="i">
            <NuxtLink :to="to(issue.file, issue.line)" :class="s.issue">
              <span :class="s.dot" :data-tone="issue.kind === 'unknown' ? 'danger' : 'warning'" aria-hidden="true" />
              <code :class="s.issueValue">{{ issue.value }}</code>
              <span :class="s.issueWhere">{{ issue.file.split('/').pop() }}:{{ issue.line }}</span>
              <span v-if="issue.kind === 'unknown' ? issue.suggestion : issue.match" :class="s.issueFix">
                → {{ issue.kind === 'unknown' ? issue.suggestion : issue.match }}
              </span>
            </NuxtLink>
          </li>
        </ul>
        <button
          v-if="summary.issues.length > ISSUE_LIMIT && !showAllIssues"
          type="button"
          :class="s.more"
          @click="showAllIssues = true"
        >
          Show {{ summary.issues.length - ISSUE_LIMIT }} more
        </button>
      </section>
    </div>
  </div>
</template>
