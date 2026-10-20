<script setup lang="ts">
import * as s from './LiveStatus.css'
import { useLiveStudio } from '~/composables/useLiveStudio'

const { connected, live } = useLiveStudio()
</script>

<template>
  <span v-if="connected" :class="s.root" :data-live="live || undefined" role="status">
    <i aria-hidden="true" />
    {{ live ? 'Live' : 'Disconnected' }}
  </span>
</template>
