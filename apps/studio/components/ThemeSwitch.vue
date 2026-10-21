<script setup lang="ts">
import { SegmentGroup } from '@ark-ui/vue/segment-group'
import * as s from './ThemeSwitch.css'
import { useTheme, type ThemePreference } from '~/composables/useTheme'

const OPTIONS = [
  { value: 'system', label: 'System', icon: 'monitor' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
] as const satisfies readonly { value: ThemePreference; label: string; icon: string }[]

const { preference, setPreference } = useTheme()
</script>

<template>
  <ClientOnly>
    <SegmentGroup.Root
      :model-value="preference"
      :class="s.root"
      aria-label="Color theme"
      @value-change="(d) => d.value && setPreference(d.value as ThemePreference)"
    >
      <SegmentGroup.Indicator :class="s.indicator" />
      <SegmentGroup.Item v-for="o in OPTIONS" :key="o.value" :value="o.value" :class="s.item" :title="o.label">
        <Icon :name="o.icon" :size="13" />
        <SegmentGroup.ItemText :class="s.label">{{ o.label }}</SegmentGroup.ItemText>
        <SegmentGroup.ItemHiddenInput />
      </SegmentGroup.Item>
    </SegmentGroup.Root>
    <template #fallback>
      <div :class="s.root" />
    </template>
  </ClientOnly>
</template>
