<script setup lang="ts">
import { Clipboard } from '@ark-ui/vue/clipboard'
import * as s from './ProjectScan.css'
import { button, frame } from 'styled-system/recipes'
import type { useProjectScan } from '~/composables/useProjectScan'

defineProps<{ scanner: ReturnType<typeof useProjectScan> }>()

const ANALYZE_COMMAND = 'panda analyze --outfile panda-usage.json'
const classes = frame()
</script>

<template>
  <div v-if="scanner.status.value === 'scanning' || scanner.busy.value" :class="s.scanning" role="status">
    <Spinner />
    Scanning your files…
  </div>

  <div v-else :class="s.root">
    <div
      :class="[classes.root, s.dropzone]"
      :data-dragging="scanner.dragging.value || undefined"
      @drop="scanner.onDrop"
      @dragover="scanner.onDragOver"
      @dragleave="scanner.onDragLeave"
    >
      <p :class="s.label">Run this in your project, then open the report it writes.</p>
      <Clipboard.Root :value="ANALYZE_COMMAND" :class="s.command">
        <code><span :class="s.prompt">$</span> {{ ANALYZE_COMMAND }}</code>
        <Clipboard.Trigger :class="button({ variant: 'ghost', size: 'icon' })" aria-label="Copy command">
          <Clipboard.Indicator>
            <Icon name="copy" :size="13" />
            <template #copied><Icon name="check" :size="13" /></template>
          </Clipboard.Indicator>
        </Clipboard.Trigger>
      </Clipboard.Root>
      <label :class="[button({ variant: 'primary', size: 'md' }), s.open]">
        <Icon name="upload" :size="14" />
        Open report
        <input type="file" accept=".json,application/json" hidden @change="scanner.onPick" />
      </label>
      <p :class="s.dropHint">or drop <code>panda-usage.json</code> here</p>
    </div>

    <p v-if="scanner.error.value" role="alert" :class="s.error">{{ scanner.error.value }}</p>

    <p :class="s.fallback">
      No CLI handy?
      <button v-if="scanner.canPickFolder()" type="button" :class="s.link" @click="scanner.choose">Scan a folder</button>
      <label v-else :class="s.link">
        Scan a folder
        <input type="file" webkitdirectory multiple hidden @change="scanner.onPick" />
      </label>
      instead. Less precise, but it shows your code.
    </p>
  </div>
</template>
