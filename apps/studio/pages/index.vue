<script setup lang="ts">
import { ref } from "vue";
import { Field } from "@ark-ui/vue/field";
import * as s from "./index.styles";
import { button, control } from "styled-system/recipes";
import { parseSpec } from "~/utils/design-system";
import { extractSpec } from "~/utils/extract-tokens";
import { saveTokens } from "~/utils/idb";
import { isIgnoredPath, isSourceFile, MAX_FILE_BYTES } from "~/utils/analyze";
import { droppedFiles } from "~/utils/dropped";
import { useFolderDrop } from "~/composables/useFolderDrop";

const error = ref("");
const pasted = ref("");
const showPaste = ref(false);

const wall = [255, 222, 194, 162, 140, 45, 22, 350].flatMap((h) =>
  [94, 86, 76, 65, 55, 46, 36, 26].map((l) => `hsl(${h} 70% ${l}%)`),
);

async function load(raw: string) {
  const result = parseSpec(raw);
  if (!result.ok) {
    error.value = result.error;
    return;
  }
  await saveTokens(raw);
  await navigateTo("/view");
}

async function loadSample() {
  droppedFiles.value = [];
  try {
    const res = await fetch("/sample-design-system.json");
    await load(await res.text());
  } catch {
    error.value = "Could not load the bundled sample.";
  }
}

async function renderPasted() {
  droppedFiles.value = [];
  await load(pasted.value);
}

const pathOf = (f: File) =>
  (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;

const { dragging, busy, onPick, onDrop, onDragOver, onDragLeave } = useFolderDrop(onFiles);

async function onFiles(files: File[]) {
  error.value = "";

  droppedFiles.value = files.filter(
    (f) => !isIgnoredPath(pathOf(f)) && f.size <= MAX_FILE_BYTES && isSourceFile(f.name),
  );

  const raw = await extractSpec(files);
  if (raw) {
    await load(raw);
    return;
  }

  const hasConfig = files.some((f) => /(^|\/)panda\.config\.(ts|js|mjs|cts|mts)$/.test(f.name));
  error.value = hasConfig
    ? "Found a panda.config but no design system spec. Run `panda codegen --spec` in this project first, then drop the folder (or its styled-system/)."
    : "No design system found in that drop. Run `panda codegen --spec`, then drop the folder — we read styled-system/specs/design-system.json.";
}
</script>

<template>
  <div :class="s.split">
    <div v-if="busy" :class="s.loadingOverlay">
      <span :class="s.spinner" />
      <span>Reading your files…</span>
    </div>
    <div :class="s.left">
      <p :class="s.kicker">Panda Studio</p>
      <h1 :class="s.h1">See your<br />design system</h1>
      <p :class="s.lede">
        Drop the <code>design-system.json</code> Panda emits and every category — colors, spacing, type,
        radii, shadows — renders here. No install, no server, no account.
      </p>

      <div
        :class="s.dropzone"
        :data-dragging="dragging || undefined"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <svg
          :class="s.dropIcon"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M17 8l-5-5-5 5" />
          <path d="M12 3v13" />
        </svg>
        <p :class="s.dropHint">
          Drop <strong>design-system.json</strong> or your whole <strong>styled-system/</strong> folder
        </p>
        <div :class="s.actions">
          <label :class="button({ variant: 'solid' })">
            Browse folder…
            <input type="file" webkitdirectory multiple hidden @change="onPick" />
          </label>
          <button type="button" :class="button({ variant: 'outline' })" @click="loadSample">
            Load sample
          </button>
        </div>
      </div>

      <div :class="s.pasteRow">
        <span :class="s.rule" />
        <button type="button" :class="s.pasteToggle" @click="showPaste = !showPaste">
          {{ showPaste ? "hide paste" : "or paste JSON" }}
        </button>
        <span :class="s.rule" />
      </div>

      <Field.Root v-if="showPaste" :class="s.field">
        <Field.Label :class="s.srOnly">Paste your design-system.json</Field.Label>
        <Field.Textarea
          :class="control({ kind: 'textarea' })"
          v-model="pasted"
          placeholder='{ "schemaVersion": 1, "categories": {...}, "paths": [...], "tokens": {...} }'
        />
        <button
          :class="button({ variant: 'outline' })"
          :disabled="!pasted.trim()"
          @click="renderPasted"
        >
          Render pasted JSON
        </button>
      </Field.Root>

      <p v-if="error" :class="s.error">{{ error }}</p>

      <p :class="s.hintMono">
        Get yours: run <strong>panda codegen --spec</strong> →
        <strong>styled-system/specs/design-system.json</strong>
      </p>
    </div>

    <div :class="s.showcase" aria-hidden="true">
      <div :class="s.wall">
        <span v-for="(c, i) in wall" :key="i" :class="s.swatch" :style="{ background: c }" />
      </div>
      <div :class="[s.floatCard, s.floatType]">
        <span :class="s.cardLabel">display / 3xl</span>
        <span :class="s.specimen">Ag</span>
        <span :class="s.specimenSub">Onest</span>
      </div>
      <div :class="[s.floatCard, s.floatShadow]">
        <span :class="s.cardLabel">shadows / lg</span>
        <span :class="s.shadowSwatch" />
      </div>
    </div>
  </div>
</template>
