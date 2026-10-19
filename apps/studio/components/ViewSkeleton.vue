<script setup lang="ts">
import * as s from './ViewSkeleton.css'
import { linkLoading } from '~/utils/spec-link-state'

const CATEGORY_WIDTHS = [72, 96, 48, 64, 84, 56, 68, 60, 80, 70, 88, 52, 76, 44, 66, 58]
const SWATCHES = 15
</script>

<template>
  <AppFrame width="wide">
    <template #sidebar>
      <div :class="s.stack" aria-hidden="true">
        <span :class="[s.bone, s.control]" />
        <span :class="[s.bone, s.control]" />
        <div :class="s.list">
          <span :class="[s.bone, s.label]" />
          <span
            v-for="(width, i) in CATEGORY_WIDTHS"
            :key="i"
            :class="[s.bone, s.navItem]"
            :style="{ width: `${width}%`, animationDelay: `${i * 40}ms` }"
          />
        </div>
      </div>
    </template>

    <template #header>
      <div :class="s.header" aria-hidden="true">
        <span :class="[s.bone, s.title]" />
        <span :class="[s.bone, s.description]" />
      </div>
    </template>

    <div role="status" :class="s.body">
      <p :class="s.status">
        <Spinner />
        {{ linkLoading ?? 'Loading your design system…' }}
      </p>
      <span :class="[s.bone, s.filter]" aria-hidden="true" />
      <div :class="s.grid" aria-hidden="true">
        <div v-for="i in SWATCHES" :key="i" :class="s.swatch" :style="{ animationDelay: `${i * 30}ms` }">
          <span :class="[s.bone, s.chip]" />
          <span :class="[s.bone, s.caption]" />
        </div>
      </div>
    </div>
  </AppFrame>
</template>
