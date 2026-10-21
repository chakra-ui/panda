<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Combobox, createListCollection } from '@ark-ui/vue/combobox'
import { Dialog } from '@ark-ui/vue/dialog'
import { Highlight } from '@ark-ui/vue/highlight'
import * as s from './DesignSearch.css'
import type { DesignSystemIndex } from '~/utils/design-system'
import {
  buildSearchIndex,
  excerpt,
  KIND_LABELS,
  searchDesignSystem,
  type SearchHit,
  type SearchKind,
} from '~/utils/search'
import { toaster } from '~/utils/toaster'

const props = defineProps<{ ds: DesignSystemIndex }>()

const route = useRoute()
const router = useRouter()

const open = ref(false)
const query = ref('')
const shortcut = ref('⌘K')

const entries = computed(() => buildSearchIndex(props.ds))
const entriesById = computed(() => new Map(entries.value.map((entry) => [entry.id, entry])))
const terms = computed(() => query.value.trim().split(/\s+/).filter(Boolean))

const hits = computed<SearchHit[]>(() =>
  query.value.trim()
    ? searchDesignSystem(entries.value, query.value)
    : entries.value.filter((e) => e.kind === 'category').map((entry) => ({ entry, score: 0 })),
)

const groups = computed(() => {
  const byKind = new Map<SearchKind, SearchHit[]>()
  for (const hit of hits.value) {
    const group = byKind.get(hit.entry.kind)
    if (group) group.push(hit)
    else byKind.set(hit.entry.kind, [hit])
  }
  return [...byKind].map(([kind, items]) => ({ kind, label: KIND_LABELS[kind], items }))
})

const collection = computed(() =>
  createListCollection({
    items: groups.value.flatMap((g) => g.items),
    itemToValue: (hit) => hit.entry.id,
    itemToString: (hit) => hit.entry.label,
  }),
)

function meta(hit: SearchHit): string {
  const { entry } = hit
  if (entry.kind === 'category') {
    const count = props.ds.categoryPaths(entry.label).length
    return `${count} token${count === 1 ? '' : 's'}`
  }
  if (entry.kind === 'token') return entry.category ?? ''
  return 'copy name'
}

// Picking clears the input before this runs, so the hit list is already gone.
async function choose(id: string) {
  const entry = entriesById.value.get(id)
  if (!entry) return
  open.value = false

  if (entry.kind === 'category' || entry.kind === 'token') {
    const { theme } = route.query
    await router.push({
      path: '/view',
      query: { theme, category: entry.category, token: entry.path },
    })
    return
  }

  try {
    await navigator.clipboard.writeText(entry.label)
    toaster.create({ title: `Copied ${entry.label}` })
  } catch {
    toaster.create({ title: "Couldn't copy. Check your browser's clipboard permission.", type: 'error' })
  }
}

watch(open, (isOpen) => {
  if (!isOpen) query.value = ''
})

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => {
  if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) shortcut.value = 'Ctrl K'
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Dialog.Root v-model:open="open" lazy-mount unmount-on-exit>
    <Dialog.Trigger :class="s.trigger">
      <Icon name="search" :size="13" />
      <span :class="s.triggerLabel">Search</span>
      <kbd :class="[s.kbd, s.triggerKbd]">{{ shortcut }}</kbd>
    </Dialog.Trigger>

    <Teleport to="body">
      <Dialog.Backdrop :class="s.backdrop" />
      <Dialog.Positioner :class="s.positioner">
        <Dialog.Content :class="s.content" aria-label="Search the design system">
          <Combobox.Root
            :collection="collection"
            :model-value="[]"
            :input-value="query"
            :open="true"
            :close-on-select="false"
            :disable-layer="true"
            :loop-focus="true"
            input-behavior="autohighlight"
            selection-behavior="clear"
            @input-value-change="(d) => (query = d.inputValue)"
            @value-change="(d) => d.value[0] && choose(d.value[0])"
          >
            <Combobox.Control :class="s.control">
              <Icon name="search" :size="15" :class="s.inputIcon" />
              <Combobox.Input
                :class="s.input"
                placeholder="Search tokens, values, conditions, recipes…"
                spellcheck="false"
              />
            </Combobox.Control>

            <Combobox.Content :class="s.results">
              <Combobox.Empty :class="s.empty">No matches for “{{ query }}”.</Combobox.Empty>
              <Combobox.ItemGroup v-for="group in groups" :key="group.kind" :class="s.group">
                <Combobox.ItemGroupLabel :class="s.groupLabel">{{ group.label }}</Combobox.ItemGroupLabel>
                <Combobox.Item v-for="hit in group.items" :key="hit.entry.id" :item="hit" :class="s.item">
                  <span
                    :class="s.swatch"
                    :data-empty="!hit.entry.color || undefined"
                    :style="hit.entry.color ? { background: hit.entry.color } : undefined"
                  />
                  <span :class="s.itemText">
                    <Combobox.ItemText :class="s.itemLabel">
                      <Highlight :text="hit.entry.label" :query="terms" ignore-case match-all />
                    </Combobox.ItemText>
                    <span v-if="hit.match" :class="s.itemMatch">
                      <span :class="s.matchField">{{ hit.match.label }}</span>
                      <Highlight :text="excerpt(hit.match.text, query)" :query="terms" ignore-case match-all />
                    </span>
                  </span>
                  <span :class="s.itemMeta">{{ meta(hit) }}</span>
                </Combobox.Item>
              </Combobox.ItemGroup>
            </Combobox.Content>
          </Combobox.Root>

          <footer :class="s.footer">
            <span><kbd :class="s.kbd">↑</kbd><kbd :class="s.kbd">↓</kbd> to move</span>
            <span><kbd :class="s.kbd">↵</kbd> to open</span>
            <span><kbd :class="s.kbd">esc</kbd> to close</span>
            <span :class="s.count">
              {{ query.trim() ? `${collection.items.length} results` : 'Names, values, recipes, conditions' }}
            </span>
          </footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>
