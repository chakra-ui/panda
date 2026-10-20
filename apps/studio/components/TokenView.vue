<script setup lang="ts">
import { computed, watch } from 'vue'
import { Tabs } from '@ark-ui/vue/tabs'
import { Field } from '@ark-ui/vue/field'
import * as s from './TokenView.css'
import { button, control, navItem } from 'styled-system/recipes'
import {
  orderCategories,
  hasPreview,
  PREVIEW_TEXT,
  themeNames,
  wantsLargePreview,
  type DesignSystemIndex,
} from '~/utils/design-system'

const props = defineProps<{
  ds: DesignSystemIndex
}>()

const route = useRoute()
const router = useRouter()

const setQuery = (patch: Record<string, string | undefined>) => router.replace({ query: { ...route.query, ...patch } })

const param = (key: string) => {
  const value = route.query[key]
  return typeof value === 'string' ? value : undefined
}

const themes = computed(() => themeNames(props.ds))
const themeItems = computed(() => [
  { label: 'Default', value: '' },
  ...themes.value.map((name) => ({
    label: name.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    value: name,
  })),
])
const theme = computed({
  get() {
    const wanted = param('theme')
    return wanted && themes.value.includes(wanted) ? wanted : ''
  },
  set: (name) => setQuery({ theme: name || undefined }),
})

const themedPaths = computed(() =>
  theme.value ? new Set(props.ds.spec.values.filter((v) => v.theme === theme.value).map((v) => v.token)) : undefined,
)

const categories = computed(() =>
  props.ds
    .categories()
    .map((type) => {
      const paths = props.ds.categoryPaths(type)
      const only = themedPaths.value
      return { type, count: only ? paths.filter((path) => only.has(path)).length : paths.length }
    })
    .filter((c) => c.count > 0),
)
const ordered = computed(() => orderCategories(categories.value))
const defaultType = computed(
  () => categories.value.find((c) => c.type === 'colors')?.type ?? ordered.value[0]?.type ?? '',
)
const activeType = computed({
  get() {
    const wanted = param('category')
    return wanted && categories.value.some((c) => c.type === wanted) ? wanted : defaultType.value
  },
  set: (type) => setQuery({ category: type === defaultType.value ? undefined : type, token: undefined }),
})

const activeIndex = computed(() => ordered.value.findIndex((c) => c.type === activeType.value))
const active = computed(() => ordered.value[activeIndex.value])
const previous = computed(() => ordered.value[activeIndex.value - 1])
const next = computed(() => ordered.value[activeIndex.value + 1])
const description = computed(() => {
  const count = active.value?.count ?? 0
  const tokens = `${count} token${count === 1 ? '' : 's'}`
  const themeLabel = theme.value && themeItems.value.find((item) => item.value === theme.value)?.label
  return themeLabel
    ? `${tokens} overridden by ${themeLabel}. Click one to copy it.`
    : `${tokens}. Click one to copy it.`
})

const search = computed({
  get: () => param('q') ?? '',
  set: (value) => setQuery({ q: value || undefined }),
})

const focusPath = computed(() => param('token'))

const showPreview = computed(() => hasPreview(activeType.value))
const largePreview = computed(() => wantsLargePreview(activeType.value))
const previewDefault = computed(() => PREVIEW_TEXT[activeType.value] ?? '')
const previewText = computed({
  get: () => param('text') ?? previewDefault.value,
  set: (value) => setQuery({ text: value && value !== previewDefault.value ? value : undefined }),
})

watch(activeType, () => setQuery({ q: undefined, text: undefined }))
</script>

<template>
  <Tabs.Root v-model="activeType" orientation="vertical" :class="s.root">
    <AppFrame width="wide">
      <template #topbar>
        <SelectField
          v-if="themes.length"
          label="Theme"
          compact
          :items="themeItems"
          :value="theme"
          :class="s.theme"
          @change="(value) => (theme = value)"
        />
        <div :class="s.search"><DesignSearch :ds="ds" /></div>
      </template>

      <template #sidebar-header>
        <StudioNav />
      </template>

      <template #sidebar>
        <SidebarSection>
          <Tabs.List :class="s.tabs" aria-label="Token categories">
            <Tabs.Trigger v-for="cat in ordered" :key="cat.type" :value="cat.type" :class="[navItem(), s.tab]">
              <span>{{ cat.type }}</span>
              <span :class="s.count">{{ cat.count }}</span>
            </Tabs.Trigger>
          </Tabs.List>
        </SidebarSection>
      </template>

      <template #header>
        <PageHeader :title="active?.type ?? ''" :description="description">
          <template #actions>
            <span :class="s.stepper">
              <button
                type="button"
                :class="button({ size: 'icon' })"
                :disabled="!previous"
                :aria-label="previous ? `Previous: ${previous.type}` : 'No previous category'"
                @click="previous && (activeType = previous.type)"
              >
                <Icon name="chevronLeft" />
              </button>
              <button
                type="button"
                :class="button({ size: 'icon' })"
                :disabled="!next"
                :aria-label="next ? `Next: ${next.type}` : 'No next category'"
                @click="next && (activeType = next.type)"
              >
                <Icon name="chevronRight" />
              </button>
            </span>
          </template>
        </PageHeader>
      </template>

      <div :class="s.toolbar">
        <Field.Root :class="[s.field, s.filter]">
          <Field.Label :class="s.srOnly">Filter tokens by name</Field.Label>
          <Icon name="search" :size="13" :class="s.filterIcon" />
          <Field.Input
            v-model="search"
            type="search"
            :placeholder="`Filter ${active?.type ?? 'tokens'} by name…`"
            :class="[control(), s.filterInput]"
          />
        </Field.Root>
        <Field.Root v-if="showPreview" :class="[s.field, largePreview && s.fieldFull]">
          <Field.Label :class="s.srOnly">Preview text</Field.Label>
          <Field.Textarea
            v-if="largePreview"
            v-model="previewText"
            rows="3"
            placeholder="Type preview text…"
            :class="[control({ kind: 'textarea' }), s.previewArea]"
          />
          <Field.Input v-else v-model="previewText" placeholder="Type preview text…" :class="control()" />
        </Field.Root>
      </div>

      <Tabs.Content
        v-for="cat in categories"
        :key="cat.type"
        :value="cat.type"
        :lazy-mount="true"
        :unmount-on-exit="true"
      >
        <TokenGrid
          :ds="ds"
          :category="cat.type"
          :theme="theme"
          :search="search"
          :preview="previewText"
          :focus="focusPath"
          :only="themedPaths"
        />
      </Tabs.Content>
    </AppFrame>
  </Tabs.Root>
</template>
