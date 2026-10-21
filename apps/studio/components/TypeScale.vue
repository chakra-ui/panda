<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { Clipboard } from '@ark-ui/vue/clipboard'
import * as s from './TypeScale.css'
import { remToPx, sortTypeTokens, toPixels, type DesignSystemIndex, type TokenView } from '~/utils/design-system'

const props = defineProps<{
  ds: DesignSystemIndex
  category: string
  tokens: TokenView[]
  preview?: string
  focus?: string
}>()

const BODY_FONT_NAMES = ['body', 'text', 'base', 'sans', 'default']

const fontFamily = computed(() => {
  const fonts = props.ds.view('fonts')
  return (BODY_FONT_NAMES.map((name) => fonts.find((t) => t.name === name)).find(Boolean) ?? fonts[0])?.value
})

const rows = computed(() => (props.category === 'fonts' ? props.tokens : sortTypeTokens(props.category, props.tokens)))

const isLeading = computed(() => props.category === 'lineHeights')

function specimenStyle(token: TokenView): CSSProperties {
  const style: CSSProperties = { fontFamily: props.category === 'fonts' ? token.value : fontFamily.value }
  const value = remToPx(token.value)
  if (props.category === 'fontSizes') style.fontSize = value
  if (props.category === 'fontWeights') style.fontWeight = value
  if (props.category === 'letterSpacings') style.letterSpacing = value
  if (props.category === 'lineHeights') style.lineHeight = value
  return style
}

const familyName = (stack: string) =>
  stack
    .split(',')[0]
    ?.trim()
    .replace(/^['"]|['"]$/g, '') || stack

const label = (token: TokenView) => (props.category === 'fonts' ? familyName(token.value) : token.value)

function detail(token: TokenView): string | undefined {
  if (!token.value.endsWith('rem')) return undefined
  const pixels = toPixels(token.value)
  return pixels === undefined ? undefined : `${pixels}px`
}
</script>

<template>
  <div :class="s.card">
    <Clipboard.Root
      v-for="token in rows"
      :key="token.path"
      :default-value="token.name"
      :timeout="1200"
      :class="s.contents"
    >
      <Clipboard.Trigger
        :class="s.row"
        :data-leading="isLeading || undefined"
        :data-token="token.path"
        :data-focused="focus === token.path || undefined"
        :aria-label="`Copy token name ${token.name}`"
      >
        <Clipboard.Context v-slot="clip">
          <span :class="s.name" :title="token.name" :data-copied="clip.copied || undefined">
            {{ clip.copied ? 'copied ✓' : token.name }}
          </span>
        </Clipboard.Context>

        <span :class="isLeading ? s.paragraph : s.line" :style="specimenStyle(token)">{{ preview }}</span>

        <span :class="s.value" :title="token.value">
          {{ label(token) }}<template v-if="detail(token)"> · {{ detail(token) }}</template>
        </span>
      </Clipboard.Trigger>
    </Clipboard.Root>
  </div>
</template>
