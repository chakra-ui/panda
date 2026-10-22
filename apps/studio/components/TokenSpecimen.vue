<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import * as s from './TokenSpecimen.css'
import { remToPx, toNumber, type Renderer } from '~/utils/design-system'

const props = defineProps<{
  category: string
  renderer: Renderer
  value: string
  onDark?: boolean
}>()

const barWidth = computed(() => {
  const n = Math.abs(toNumber(props.value))
  return `min(${Number.isFinite(n) ? n : 9999}px, 100%)`
})

const motionStyle = computed<CSSProperties>(() => {
  if (props.category === 'animations') return { animation: props.value }
  if (props.category === 'durations') return { animation: `studioSlide ${props.value} ease-in-out infinite` }
  return { animation: `studioSlide 1.4s ${props.value} infinite` }
})
</script>

<template>
  <span
    :class="s.root"
    :data-on-dark="onDark || undefined"
    :data-fill="(renderer === 'scale' && category !== 'radii') || undefined"
  >
    <template v-if="renderer === 'scale'">
      <span v-if="category === 'radii'" :class="s.radius" :style="{ borderTopLeftRadius: remToPx(value) }" />
      <span v-else :class="s.lane"><span :class="s.bar" :style="{ width: barWidth }" /></span>
    </template>
    <span
      v-else-if="renderer === 'box'"
      :class="s.box({ light: category === 'shadows' })"
      :style="category === 'shadows' ? { boxShadow: value } : { border: value }"
      >Aa</span
    >
    <span v-else-if="renderer === 'motion'" :class="s.motion" :style="motionStyle" />
    <span v-else-if="renderer === 'ratio'" :class="s.ratio" :style="{ aspectRatio: value }" />
    <span v-else-if="renderer === 'blur'" :class="s.blur" :style="{ filter: `blur(${value})` }" />
    <span v-else-if="renderer === 'opacity'" :class="s.checker">
      <span :class="s.opacityFill" :style="{ opacity: value }" />
    </span>
  </span>
</template>
