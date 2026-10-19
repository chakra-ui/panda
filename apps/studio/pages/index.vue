<script setup lang="ts">
import { ref } from 'vue'
import { Clipboard } from '@ark-ui/vue/clipboard'
import { Field } from '@ark-ui/vue/field'
import { Tabs } from '@ark-ui/vue/tabs'
import * as s from './index.css'
import { button, control, frame, navItem, tabs } from 'styled-system/recipes'
import { extractSpec } from '~/utils/extract-tokens'
import { openSpec } from '~/utils/open-spec'
import { isIgnoredPath, isSourceFile, MAX_FILE_BYTES } from '~/utils/analyze'
import { droppedFiles } from '~/utils/dropped'
import { useFolderDrop } from '~/composables/useFolderDrop'

useHead({ title: 'Panda Studio — see your design system' })

const CODEGEN_COMMAND = 'panda codegen --spec'

const classes = frame()
const tab = tabs()
const error = ref('')
const pasted = ref('')

async function load(raw: string) {
  error.value = ''
  const result = await openSpec(raw)
  if (!result.ok) error.value = result.error
}

async function loadSample() {
  droppedFiles.value = []
  try {
    const res = await fetch('/sample-design-system.json')
    await load(await res.text())
  } catch {
    error.value = "Couldn't load the sample. Reload the page and try again."
  }
}

async function renderPasted() {
  droppedFiles.value = []
  await load(pasted.value)
}

const pathOf = (f: File) => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name

const { dragging, busy, onPick, onDrop, onDragOver, onDragLeave } = useFolderDrop(onFiles)

async function onFiles(files: File[]) {
  error.value = ''

  droppedFiles.value = files.filter(
    (f) => !isIgnoredPath(pathOf(f)) && f.size <= MAX_FILE_BYTES && isSourceFile(f.name),
  )

  const raw = await extractSpec(files)
  if (raw) {
    await load(raw)
    return
  }

  error.value =
    "That isn't a design-system.json. Run `panda codegen --spec` and open styled-system/specs/design-system.json."
}
</script>

<template>
  <AppFrame>
    <template #sidebar>
      <SidebarSection label="Get started">
        <NuxtLink to="/" :class="navItem()">Open a system</NuxtLink>
        <NuxtLink to="/analyze" :class="navItem()">Analyze usage</NuxtLink>
      </SidebarSection>
      <SidebarSection label="Resources">
        <a href="https://panda-css.com/docs" target="_blank" rel="noopener" :class="navItem()"> Documentation </a>
        <a href="https://github.com/chakra-ui/panda" target="_blank" rel="noopener" :class="navItem()"> GitHub </a>
      </SidebarSection>
    </template>

    <template #header>
      <PageHeader title="Open a design system">
        <template #description> Browse every token in the <code>design-system.json</code> Panda generates. </template>
      </PageHeader>
    </template>

    <BusyOverlay v-if="busy" label="Reading your file…" />

    <p v-if="error" role="alert" :class="s.error">{{ error }}</p>

    <Tabs.Root default-value="files" :class="tab.root">
      <Tabs.List :class="tab.list" aria-label="Where to load from">
        <Tabs.Trigger value="files" :class="tab.trigger">File</Tabs.Trigger>
        <Tabs.Trigger value="url" :class="tab.trigger">URL</Tabs.Trigger>
        <Tabs.Trigger value="paste" :class="tab.trigger">Paste JSON</Tabs.Trigger>
        <Tabs.Indicator :class="tab.indicator" />
      </Tabs.List>

      <Tabs.Content value="files" :class="tab.content">
        <div :class="classes.root">
          <div
            :class="[classes.body, s.dropzone]"
            :data-dragging="dragging || undefined"
            @drop="onDrop"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
          >
            <span :class="s.dropIcon"><Icon name="upload" :size="16" /></span>
            <p :class="s.dropTitle">Drop your <code>design-system.json</code></p>
            <p :class="s.dropHint">It's in <code>styled-system/specs/</code> after you run the command below.</p>
            <div :class="s.dropActions">
              <label :class="button({ variant: 'primary', size: 'md' })">
                Choose file
                <input type="file" accept=".json,application/json" hidden @change="onPick" />
              </label>
              <button type="button" :class="button({ size: 'md' })" @click="loadSample">Try the sample</button>
            </div>
          </div>
          <p :class="classes.bar">
            <Icon name="info" :size="13" />
            <span>Files are read locally and never uploaded.</span>
          </p>
        </div>
      </Tabs.Content>

      <Tabs.Content value="url" :class="tab.content">
        <LoadFromUrl />
      </Tabs.Content>

      <Tabs.Content value="paste" :class="tab.content">
        <div :class="classes.root">
          <Field.Root :class="[classes.body, s.pasteField]">
            <Field.Label :class="s.pasteLabel">Paste the file contents</Field.Label>
            <Field.Textarea
              v-model="pasted"
              :class="control({ kind: 'textarea' })"
              placeholder='{ "schemaVersion": 1, "categories": {...}, "paths": [...], "tokens": {...} }'
            />
            <button
              type="button"
              :class="[button({ variant: 'primary', size: 'md' }), s.pasteSubmit]"
              :disabled="!pasted.trim()"
              @click="renderPasted"
            >
              Open
            </button>
          </Field.Root>
        </div>
      </Tabs.Content>
    </Tabs.Root>

    <PageSection title="Generate the file" :class="s.getOne">
      <div :class="classes.root">
        <Clipboard.Root :value="CODEGEN_COMMAND" :class="[classes.body, s.command]">
          <code :class="s.commandText"><span :class="s.prompt">$</span> {{ CODEGEN_COMMAND }}</code>
          <Clipboard.Trigger :class="button({ variant: 'ghost', size: 'icon' })" aria-label="Copy command">
            <Clipboard.Indicator>
              <Icon name="copy" :size="13" />
              <template #copied><Icon name="check" :size="13" /></template>
            </Clipboard.Indicator>
          </Clipboard.Trigger>
        </Clipboard.Root>
        <p :class="classes.bar">
          <span>Run it in your Panda project. It writes <code>styled-system/specs/design-system.json</code>.</span>
        </p>
      </div>
    </PageSection>
  </AppFrame>
</template>
