<script setup lang="ts">
import { Clipboard } from '@ark-ui/vue/clipboard'
import { Popover } from '@ark-ui/vue/popover'
import * as s from './ColorSwatch.css'
import { tokenCell } from 'styled-system/recipes'
import type { DesignSystemValue, TokenView } from '~/utils/design-system'

defineProps<{
  token: TokenView
  states: DesignSystemValue[]
  label: string
  focused?: boolean
}>()

const conditionOf = (state: DesignSystemValue) => state.condition?.replace(/^_/, '') ?? 'base'
</script>

<template>
  <div :class="s.cell">
    <Clipboard.Root :default-value="token.name" :timeout="1200" :class="s.contents">
      <Clipboard.Trigger
        :class="tokenCell({ layout: 'swatch' })"
        :data-token="token.path"
        :data-focused="focused || undefined"
        :aria-label="`Copy token name ${token.name}`"
      >
        <span :class="s.chip">
          <span
            v-for="state in states"
            :key="state.condition ?? 'base'"
            :class="s.band"
            :style="{ background: state.value }"
          />
        </span>
        <span v-if="states.length > 1" :class="s.conditions">
          <span v-for="state in states" :key="state.condition ?? 'base'">{{ conditionOf(state) }}</span>
        </span>
        <Clipboard.Context v-slot="clip">
          <span :class="s.name" :data-copied="clip.copied || undefined">
            {{ clip.copied ? 'copied ✓' : label }}
          </span>
        </Clipboard.Context>
      </Clipboard.Trigger>
    </Clipboard.Root>

    <Popover.Context v-slot="api">
      <Popover.Trigger
        :value="token.path"
        :class="s.infoTrigger"
        :data-open="(api.open && api.triggerValue === token.path) || undefined"
        :aria-label="`Values for ${token.name}`"
      >
        <Icon name="info" :size="12" :stroke-width="2.2" />
      </Popover.Trigger>
    </Popover.Context>
  </div>
</template>
