<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { Clipboard } from '@ark-ui/vue/clipboard'
import { Popover } from '@ark-ui/vue/popover'
import * as s from './TokenGrid.css'
import { tokenCell } from 'styled-system/recipes'
import {
  aliasOf,
  groupColors,
  isDarkCondition,
  isSemantic,
  rendererFor,
  toNumber,
  toPixels,
  type DesignSystemIndex,
  type TokenView,
} from '~/utils/design-system'

const props = defineProps<{
  ds: DesignSystemIndex
  category: string
  theme?: string
  search: string
  preview?: string
  focus?: string
  only?: Set<string>
}>()

const statesOf = (path: string) => props.ds.states(path, props.theme)
const conditionOf = (state: { condition?: string }) => state.condition?.replace(/^_/, '') ?? 'base'

const tokens = computed(() => {
  const all = props.ds.view(props.category, { theme: props.theme })
  const { only } = props
  return only ? all.filter((t) => only.has(t.path)) : all
})

const renderer = computed(() => rendererFor(props.category))

const values = computed<TokenView[]>(() => {
  const q = props.search.trim().toLowerCase()
  const list = q ? tokens.value.filter((t) => t.name.toLowerCase().includes(q)) : tokens.value
  if (renderer.value === 'scale') {
    return list.toSorted((a, b) => Math.abs(toNumber(a.value)) - Math.abs(toNumber(b.value)))
  }
  return list
})

const sections = computed(() =>
  [
    { label: 'Semantic', tokens: values.value.filter((t) => isSemantic(props.ds, t)) },
    { label: 'Core', tokens: values.value.filter((t) => !isSemantic(props.ds, t)) },
  ].filter((section) => section.tokens.length),
)

const colorPalettes = computed(() => groupColors(sections.value.find((x) => x.label === 'Core')?.tokens ?? []))

watch(
  () => props.focus,
  async (path) => {
    if (!path || !import.meta.client) return
    await nextTick()
    document
      .querySelector(`[data-token="${CSS.escape(path)}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  },
  { immediate: true },
)

const withPixels = (value: string) => {
  const pixels = value.endsWith('rem') ? toPixels(value) : undefined
  return pixels === undefined ? value : `${value} · ${pixels}px`
}

const numbered = (list: TokenView[]) => list.map((t) => ({ ...t, n: toNumber(t.value) }))
const layerRows = (list: TokenView[]) => numbered(list).toSorted((a, b) => b.n - a.n)
const screenRows = (list: TokenView[]) => numbered(list).toSorted((a, b) => a.n - b.n)
const maxScreen = (list: TokenView[]) => Math.max(...numbered(list).map((t) => t.n), 1)
</script>

<template>
  <p v-if="!values.length" :class="s.empty">No tokens match “{{ search }}”. Try part of the name.</p>

  <Popover.Root v-else :positioning="{ placement: 'bottom-start', gutter: 6 }">
    <section v-for="section in sections" :key="section.label" :class="s.section.root">
      <p v-if="sections.length > 1" :class="s.section.head">
        {{ section.label }} <span :class="s.section.count">{{ section.tokens.length }}</span>
      </p>

      <template v-if="renderer === 'colors'">
        <div v-if="section.label === 'Semantic'" :class="s.swatches">
          <ColorSwatch
            v-for="t in section.tokens"
            :key="t.path"
            :token="t"
            :states="statesOf(t.path)"
            :label="t.name"
            :focused="focus === t.path"
          />
        </div>
        <template v-else>
          <div v-for="palette in colorPalettes" :key="palette.name" :class="s.palette.root">
            <p v-if="palette.name !== 'base'" :class="s.palette.head">
              {{ palette.name }} <span :class="s.section.count">{{ palette.tokens.length }}</span>
            </p>
            <div :class="s.swatches">
              <ColorSwatch
                v-for="{ token } in palette.tokens"
                :key="token.path"
                :token="token"
                :states="statesOf(token.path)"
                :label="token.name"
                :focused="focus === token.path"
              />
            </div>
          </div>
        </template>
      </template>

      <TypeScale
        v-else-if="renderer === 'ramp' || renderer === 'fonts'"
        :ds="ds"
        :category="category"
        :tokens="section.tokens"
        :preview="preview"
        :focus="focus"
      />

      <div v-else-if="renderer === 'layers'" :class="s.layer.list">
        <Clipboard.Root
          v-for="(t, i) in layerRows(section.tokens)"
          :key="t.name"
          :default-value="t.name"
          :timeout="1200"
          :class="s.contents"
        >
          <Clipboard.Trigger
            :class="s.layer.card"
            :data-token="t.path"
            :data-focused="focus === t.path || undefined"
            :style="{
              marginLeft: `${Math.min(i, 8) * 16}px`,
              boxShadow: `0 ${8 - Math.min(i, 6)}px ${20 - Math.min(i * 2, 14)}px -8px rgba(0,0,0,0.35)`,
            }"
            :aria-label="`Copy token name ${t.name}`"
          >
            <span :class="s.layer.name">{{ t.name }}</span>
            <span :class="s.layer.value">{{ t.value }}</span>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </div>

      <div v-else-if="renderer === 'screens'" :class="s.screen.list">
        <Clipboard.Root
          v-for="t in screenRows(section.tokens)"
          :key="t.name"
          :default-value="t.name"
          :timeout="1200"
          :class="s.contents"
        >
          <Clipboard.Trigger
            :class="s.screen.row"
            :data-token="t.path"
            :data-focused="focus === t.path || undefined"
            :aria-label="`Copy token name ${t.name}`"
          >
            <span :class="s.screen.name">{{ t.name }}</span>
            <span :class="s.screen.lane">
              <span :class="s.screen.bar" :style="{ width: `${(t.n / maxScreen(section.tokens)) * 100}%` }" />
            </span>
            <span :class="s.screen.value">{{ t.value }}</span>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </div>

      <div v-else :class="s.row.list">
        <Clipboard.Root
          v-for="t in section.tokens"
          :key="t.name"
          :default-value="t.name"
          :timeout="1200"
          :class="s.contents"
        >
          <Clipboard.Trigger
            :class="tokenCell({ layout: 'row' })"
            :data-token="t.path"
            :data-focused="focus === t.path || undefined"
            :aria-label="`Copy token name ${t.name}`"
          >
            <span :class="s.row.name">{{ t.name }}</span>

            <span :class="s.row.track" aria-hidden="true">
              <template v-if="statesOf(t.path).length > 1">
                <span v-for="st in statesOf(t.path)" :key="st.condition ?? 'base'" :class="s.variant.root">
                  <TokenSpecimen
                    :category="category"
                    :renderer="renderer"
                    :value="st.value"
                    :on-dark="isDarkCondition(st.condition)"
                  />
                  <span :class="s.variant.label">{{ conditionOf(st) }}</span>
                </span>
              </template>
              <TokenSpecimen v-else :category="category" :renderer="renderer" :value="t.value" />
            </span>

            <Clipboard.Context v-slot="clip">
              <span :class="s.row.value" :data-copied="clip.copied || undefined">
                {{ clip.copied ? 'copied ✓' : withPixels(t.value) }}
                <span v-if="!clip.copied && aliasOf(t)" :class="s.row.alias">→ {{ aliasOf(t) }}</span>
              </span>
            </Clipboard.Context>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </div>
    </section>

    <Teleport to="body">
      <Popover.Positioner>
        <Popover.Content :class="s.info.content">
          <Popover.Context v-slot="api">
            <template v-if="api.triggerValue">
              <p :class="s.info.name">{{ props.ds.name(api.triggerValue) }}</p>
              <dl :class="s.info.list">
                <template v-for="st in statesOf(api.triggerValue)" :key="st.condition ?? 'base'">
                  <dt :class="s.info.term">
                    <span :class="s.info.swatch" :style="{ background: st.value }" />
                    {{ conditionOf(st) }}
                  </dt>
                  <dd :class="s.info.value">{{ st.value }}</dd>
                </template>
              </dl>
            </template>
          </Popover.Context>
        </Popover.Content>
      </Popover.Positioner>
    </Teleport>
  </Popover.Root>
</template>
