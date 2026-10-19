<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as s from './error.css'
import { button } from 'styled-system/recipes'

const props = defineProps<{ error: { statusCode?: number; message?: string; url?: string } }>()

const code = props.error?.statusCode ?? 404
const isNotFound = code === 404

const clientPath = ref('')
onMounted(() => {
  clientPath.value = window.location.pathname
})
const path = computed(() => props.error?.url || clientPath.value)

const headline = isNotFound ? "This route isn't in the spec." : "Something didn't render."
const detail = computed(() => (isNotFound ? path.value : props.error?.message || ''))

useHead({ title: `${code} · Panda Studio` })
</script>

<template>
  <div :class="s.page">
    <main :class="s.card">
      <span :class="s.code">{{ code }}</span>
      <h1 :class="s.headline">{{ headline }}</h1>
      <p v-if="detail" :class="s.detail">{{ detail }}</p>
      <button
        type="button"
        :class="[button({ variant: 'primary', size: 'md' }), s.action]"
        @click="clearError({ redirect: '/' })"
      >
        Back to Studio
      </button>
    </main>
  </div>
</template>
