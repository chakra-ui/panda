<script setup lang="ts">
import { computed } from "vue";
import { Clipboard } from "@ark-ui/vue";
import * as s from "./TokenGrid.styles";
import { tokenCell } from "styled-system/recipes";
import { rendererFor, toNumber, type Category, type Token } from "~/utils/tokens";
import { isSemantic } from "~/utils/token-model";
import { contrastRatio, wcagLevel } from "~/utils/contrast";

const props = defineProps<{ category: Category; search: string; resolveVars?: boolean }>();

function contrast(value: string) {
  const onWhite = contrastRatio(value, "#ffffff");
  const onBlack = contrastRatio(value, "#000000");
  if (onWhite == null || onBlack == null) return null;
  return [
    { bg: "#ffffff", ratio: onWhite, level: wcagLevel(onWhite) },
    { bg: "#000000", ratio: onBlack, level: wcagLevel(onBlack) },
  ];
}

const renderer = computed(() => rendererFor(props.category.type));

const colorGroups = computed(() =>
  [
    { label: "Semantic", items: values.value.filter((t) => isSemantic(t.value)) },
    { label: "Core", items: values.value.filter((t) => !isSemantic(t.value)) },
  ].filter((g) => g.items.length),
);

const values = computed<Token[]>(() => {
  const q = props.search.trim().toLowerCase();
  const list = q
    ? props.category.values.filter((t) => t.name.toLowerCase().includes(q))
    : props.category.values;
  if (renderer.value === "scale") {
    return list.toSorted((a, b) => Math.abs(toNumber(a.value)) - Math.abs(toNumber(b.value)));
  }
  return list;
});

function barWidth(value: string): string {
  const n = Math.abs(toNumber(value));
  return `min(${Number.isFinite(n) ? n : 9999}px, 100%)`;
}

const layerRows = computed(() =>
  values.value.map((t) => ({ ...t, n: toNumber(t.value) })).toSorted((a, b) => b.n - a.n),
);
const screenRows = computed(() =>
  values.value.map((t) => ({ ...t, n: toNumber(t.value) })).toSorted((a, b) => a.n - b.n),
);
const maxScreen = computed(() => Math.max(...screenRows.value.map((t) => t.n), 1));
</script>

<template>
  <p v-if="!values.length" :class="s.empty">No tokens match “{{ search }}”.</p>

  <div v-else-if="renderer === 'colors'">
    <template v-for="g in colorGroups" :key="g.label">
      <p v-if="colorGroups.length > 1" :class="s.groupHead">
        {{ g.label }} <span :class="s.groupCount">{{ g.items.length }}</span>
      </p>
      <div :class="s.swatches">
        <Clipboard.Root
          v-for="t in g.items"
          :key="t.name"
          :value="t.name"
          :timeout="1200"
          :class="s.contents"
        >
          <Clipboard.Trigger
            :class="tokenCell({ layout: 'swatch' })"
            :aria-label="`Copy token name ${t.name}`"
          >
            <span :class="s.chip">
              <span
                v-if="!props.resolveVars && t.value.startsWith('var(')"
                :class="s.chipRef"
                title="References a value resolved at build time — drop your styled-system/styles.css to see it"
                >↗ ref</span
              >
              <span v-else :class="s.chipFill" :style="{ background: t.value }" />
            </span>
            <span :class="s.meta">
              <span :class="s.name">{{ t.name }}</span>
              <Clipboard.Context v-slot="clip">
                <span :class="[s.val, clip.copied && s.copied]">{{
                  clip.copied ? "copied name ✓" : t.value
                }}</span>
              </Clipboard.Context>
              <span v-if="contrast(t.value)" :class="s.contrast">
                <span v-for="c in contrast(t.value)!" :key="c.bg" :class="s.contrastItem">
                  <span :class="s.contrastAa" :style="{ background: c.bg, color: t.value }">Aa</span>
                  <span :class="[s.contrastLabel, c.level !== 'Fail' && s.contrastPass]"
                    >{{ c.ratio.toFixed(1) }} {{ c.level }}</span
                  >
                </span>
              </span>
            </span>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </div>
    </template>
  </div>

  <div v-else-if="renderer === 'layers'" :class="s.layers">
    <Clipboard.Root
      v-for="(t, i) in layerRows"
      :key="t.name"
      :value="t.name"
      :timeout="1200"
      :class="s.contents"
    >
      <Clipboard.Trigger
        :class="s.layer"
        :style="{
          marginLeft: `${Math.min(i, 8) * 16}px`,
          boxShadow: `0 ${8 - Math.min(i, 6)}px ${20 - Math.min(i * 2, 14)}px -8px rgba(0,0,0,0.35)`,
        }"
        :aria-label="`Copy token name ${t.name}`"
      >
        <span :class="s.layerName">{{ t.name }}</span>
        <span :class="s.layerVal">{{ t.value }}</span>
      </Clipboard.Trigger>
    </Clipboard.Root>
  </div>

  <div v-else-if="renderer === 'screens'" :class="s.screens">
    <Clipboard.Root
      v-for="t in screenRows"
      :key="t.name"
      :value="t.name"
      :timeout="1200"
      :class="s.contents"
    >
      <Clipboard.Trigger :class="s.screen" :aria-label="`Copy token name ${t.name}`">
        <span :class="s.screenName">{{ t.name }}</span>
        <span :class="s.screenLane">
          <span :class="s.screenBar" :style="{ width: `${(t.n / maxScreen) * 100}%` }" />
        </span>
        <span :class="s.screenVal">{{ t.value }}</span>
      </Clipboard.Trigger>
    </Clipboard.Root>
  </div>

  <div v-else :class="s.rows">
    <Clipboard.Root
      v-for="t in values"
      :key="t.name"
      :value="t.name"
      :timeout="1200"
      :class="s.contents"
    >
      <Clipboard.Trigger
        :class="tokenCell({ layout: 'row' })"
        :aria-label="`Copy token name ${t.name}`"
      >
        <span :class="s.rowName">{{ t.name }}</span>

        <span :class="s.track" aria-hidden="true">
          <template v-if="renderer === 'scale'">
            <span
              v-if="category.type === 'radii'"
              :class="s.radiusBox"
              :style="{ borderRadius: t.value }"
            />
            <span v-else :class="s.lane"
              ><span :class="s.bar" :style="{ width: barWidth(t.value) }"
            /></span>
          </template>
          <span
            v-else-if="renderer === 'fonts'"
            :class="s.specimen"
            :style="{ fontFamily: t.value, fontSize: '22px' }"
            >The quick brown fox jumps</span
          >
          <span
            v-else-if="renderer === 'ramp'"
            :class="s.specimen"
            :style="{
              fontSize: category.type === 'fontSizes' ? t.value : '17px',
              lineHeight: category.type === 'lineHeights' ? t.value : '1.2',
              letterSpacing: category.type === 'letterSpacings' ? t.value : 'normal',
              fontWeight: category.type === 'fontWeights' ? t.value : '400',
            }"
            >The quick brown fox</span
          >
          <span
            v-else-if="renderer === 'box'"
            :class="[s.boxDemo, category.type === 'shadows' && s.boxDemoLight]"
            :style="category.type === 'shadows' ? { boxShadow: t.value } : { border: t.value }"
            >Aa</span
          >
          <span
            v-else-if="renderer === 'motion'"
            :class="s.motionChip"
            :style="
              category.type === 'animations'
                ? { animation: t.value }
                : category.type === 'durations'
                  ? { animation: `studioSlide ${t.value} ease-in-out infinite` }
                  : { animation: `studioSlide 1.4s ${t.value} infinite` }
            "
          />
          <span
            v-else-if="renderer === 'ratio'"
            :class="s.ratioBox"
            :style="{ aspectRatio: t.value }"
          />
          <span
            v-else-if="renderer === 'blur'"
            :class="s.blurTile"
            :style="{ filter: `blur(${t.value})` }"
          />
        </span>

        <Clipboard.Context v-slot="clip">
          <span :class="[s.rowVal, clip.copied && s.copied]">{{
            clip.copied ? "copied ✓" : t.value
          }}</span>
        </Clipboard.Context>
      </Clipboard.Trigger>
    </Clipboard.Root>
  </div>
</template>
