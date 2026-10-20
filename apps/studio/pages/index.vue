<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clipboard } from '@ark-ui/vue/clipboard'
import * as s from './index.css'
import { extractSpec } from '~/utils/extract-tokens'
import { openSpec } from '~/utils/open-spec'
import { openSpecLink } from '~/utils/open-spec-link'
import { parseSpecUrlInput } from '~/utils/spec-link'
import { isIgnoredPath, isSourceFile, MAX_FILE_BYTES } from '~/utils/analyze'
import { droppedFiles } from '~/utils/dropped'
import { useFolderDrop } from '~/composables/useFolderDrop'

useHead({ title: 'Panda Studio — see your design system' })

const CODEGEN_COMMAND = 'panda codegen --spec'

const nuxtApp = useNuxtApp()
const router = useRouter()

const input = ref('')
const error = ref('')
const opening = ref(false)

const isJson = computed(() => input.value.trimStart().startsWith('{'))

const detected = computed(() => {
  if (!input.value.trim()) return ''
  if (!isJson.value) return 'Link'
  const kb = new Blob([input.value]).size / 1024
  return `JSON · ${kb < 1 ? '<1' : Math.round(kb)} KB`
})

watch(input, () => (error.value = ''))

async function run(task: () => Promise<{ ok: true } | { ok: false; error: string }>) {
  error.value = ''
  opening.value = true
  try {
    const result = await task()
    if (!result.ok) error.value = result.error
  } finally {
    opening.value = false
  }
}

function submit() {
  const value = input.value.trim()
  if (!value) return
  droppedFiles.value = []
  if (isJson.value) return run(() => openSpec(value))
  const parsed = parseSpecUrlInput(value)
  if (!parsed.ok) {
    error.value = parsed.error
    return
  }
  return run(() => openSpecLink({ kind: 'url', url: parsed.url }, { router, nuxtApp }))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    submit()
  }
}

function loadSample() {
  droppedFiles.value = []
  return run(async () => {
    const res = await fetch('/sample-design-system.json').catch(() => null)
    if (!res?.ok) return { ok: false, error: "Couldn't load the sample. Reload the page and try again." }
    return openSpec(await res.text())
  })
}

const pathOf = (f: File) => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name

const { dragging, busy, onPick, onDrop, onDragOver, onDragLeave } = useFolderDrop(async (files) => {
  droppedFiles.value = files.filter(
    (f) => !isIgnoredPath(pathOf(f)) && f.size <= MAX_FILE_BYTES && isSourceFile(f.name),
  )
  const raw = await extractSpec(files)
  if (raw) return run(() => openSpec(raw))
  error.value =
    "That isn't a design-system.json. Run the command below, then open styled-system/specs/design-system.json."
})
</script>

<template>
  <div :class="s.page" @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave">
    <header :class="s.top">
      <a href="https://panda-css.com/docs" target="_blank" rel="noopener" :class="s.topLink">
        Docs
        <Icon name="arrowUpRight" :size="12" />
      </a>
      <ThemeSwitch />
    </header>

    <main id="content" :class="s.center">
      <StudioLogo size="lg" />
      <h1 :class="s.title">Your design system, at a glance</h1>
      <p :class="s.lede">Open the <code>design-system.json</code> Panda generates to browse every token.</p>

      <form :class="s.composer" :data-invalid="error ? '' : undefined" novalidate @submit.prevent="submit">
        <label for="spec-input" :class="s.srOnly">Link to design-system.json, or its contents</label>
        <textarea
          id="spec-input"
          v-model="input"
          :class="s.input"
          :data-json="isJson || undefined"
          spellcheck="false"
          autocomplete="off"
          placeholder="Paste a link or the JSON, or drop a file"
          aria-describedby="spec-error"
          @keydown="onKeydown"
        />
        <div :class="s.composerBar">
          <label :class="s.attach">
            <Icon name="paperclip" :size="14" />
            Choose file
            <input type="file" accept=".json,application/json" hidden @change="onPick" />
          </label>
          <span :class="s.actions">
            <span v-if="detected" :class="s.kind">{{ detected }}</span>
            <button type="submit" :class="s.send" :disabled="!input.trim() || opening" aria-label="Open">
              <Spinner v-if="opening" />
              <Icon v-else name="arrowUp" :size="15" />
            </button>
          </span>
        </div>
      </form>

      <p id="spec-error" role="alert" :class="s.error">{{ error }}</p>

      <div :class="s.chips">
        <button type="button" :class="s.chip({ tone: 'accent' })" @click="loadSample">
          Try the sample
          <Icon name="chevronRight" :size="13" />
        </button>
        <Clipboard.Root :value="CODEGEN_COMMAND">
          <Clipboard.Trigger :class="[s.chip(), s.command]">
            <span :class="s.prompt">$</span> {{ CODEGEN_COMMAND }}
            <Clipboard.Indicator>
              <Icon name="copy" :size="12" />
              <template #copied><Icon name="check" :size="12" /></template>
            </Clipboard.Indicator>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </div>

      <p :class="s.footnote">Your file stays in this browser.</p>
    </main>

    <div :class="s.strip" aria-hidden="true" />

    <div v-if="dragging" :class="s.dropOverlay" aria-hidden="true">
      <span :class="s.dropCard">
        <Icon name="upload" :size="16" />
        Drop to open
      </span>
    </div>

    <BusyOverlay v-if="busy" label="Reading your file…" />
  </div>
</template>
