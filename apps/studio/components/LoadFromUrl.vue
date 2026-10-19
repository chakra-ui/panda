<script setup lang="ts">
import { ref, watch } from 'vue'
import { Field } from '@ark-ui/vue/field'
import * as s from './LoadFromUrl.css'
import { button, control, frame } from 'styled-system/recipes'
import { openSpecLink } from '~/utils/open-spec-link'
import { parseSpecUrlInput } from '~/utils/spec-link'

const nuxtApp = useNuxtApp()
const router = useRouter()
const classes = frame()

const url = ref('')
const error = ref('')
const loading = ref(false)

watch(url, () => (error.value = ''))

async function submit() {
  const parsed = parseSpecUrlInput(url.value)
  if (!parsed.ok) {
    error.value = parsed.error
    return
  }
  loading.value = true
  try {
    const result = await openSpecLink({ kind: 'url', url: parsed.url }, { router, nuxtApp })
    if (!result.ok) error.value = result.error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form :class="classes.root" novalidate @submit.prevent="submit">
    <Field.Root :invalid="!!error" :class="[classes.body, s.body]">
      <Field.Label :class="s.label">Design system URL</Field.Label>
      <div :class="s.row">
        <Field.Input
          v-model="url"
          type="url"
          inputmode="url"
          autocomplete="url"
          spellcheck="false"
          placeholder="https://example.com/design-system.json"
          :class="control()"
        />
        <button type="submit" :class="button({ variant: 'primary', size: 'md' })" :disabled="loading || !url.trim()">
          <Spinner v-if="loading" />
          {{ loading ? 'Opening' : 'Open' }}
        </button>
      </div>
      <Field.ErrorText :class="s.error">{{ error }}</Field.ErrorText>
    </Field.Root>
    <p :class="classes.bar">
      <Icon name="link" :size="13" />
      <span>
        The server must allow cross-origin requests. GitHub file links work, and the page you land on is shareable.
      </span>
    </p>
  </form>
</template>
