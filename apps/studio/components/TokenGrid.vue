<script setup lang="ts">
import { computed } from "vue";
import { Clipboard } from "@ark-ui/vue/clipboard";
import { Popover } from "@ark-ui/vue/popover";
import * as s from "./TokenGrid.styles";
import { tokenCell } from "styled-system/recipes";
import { rendererFor, toNumber, type DesignSystemIndex, type TokenView } from "~/utils/design-system";

const props = defineProps<{
  ds: DesignSystemIndex;
  category: string;
  theme?: string;
  search: string;
  preview?: string;
}>();

/** Conditions render side by side rather than behind a switch. */
const statesOf = (path: string) => props.ds.states(path, props.theme);
const conditionOf = (state: { condition?: string }) => state.condition?.replace(/^_/, "") ?? "base";

/** Derived here, not passed in, so each tab only ever holds its own tokens. */
const tokens = computed(() => props.ds.view(props.category, { theme: props.theme }));


const renderer = computed(() => rendererFor(props.category));

const colorGroups = computed(() =>
  [
    { label: "Semantic", items: values.value.filter((t) => t.semantic) },
    { label: "Core", items: values.value.filter((t) => !t.semantic) },
  ].filter((g) => g.items.length),
);

const values = computed<TokenView[]>(() => {
  const q = props.search.trim().toLowerCase();
  const list = q ? tokens.value.filter((t) => t.name.toLowerCase().includes(q)) : tokens.value;
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
    <Popover.Root :positioning="{ placement: 'bottom-start', gutter: 6 }">
      <template v-for="g in colorGroups" :key="g.label">
        <p v-if="colorGroups.length > 1" :class="s.groupHead">
          {{ g.label }} <span :class="s.groupCount">{{ g.items.length }}</span>
        </p>
        <div :class="s.swatches">
          <div v-for="t in g.items" :key="t.name" :class="s.swatchCell">
            <Clipboard.Root :default-value="t.name" :timeout="1200" :class="s.contents">
              <Clipboard.Trigger
                :class="tokenCell({ layout: 'swatch' })"
                :aria-label="`Copy token name ${t.name}`"
              >
                <span :class="s.chip">
                  <span
                    v-for="st in statesOf(t.path)"
                    :key="st.condition ?? 'base'"
                    :class="s.chipBand"
                    :style="{ background: st.value }"
                  />
                </span>
                <span v-if="statesOf(t.path).length > 1" :class="s.chipConditions">
                  <span v-for="st in statesOf(t.path)" :key="st.condition ?? 'base'">{{
                    conditionOf(st)
                  }}</span>
                </span>
                <span :class="s.meta">
                  <Clipboard.Context v-slot="clip">
                    <span :class="[s.name, clip.copied && s.copied]">{{
                      clip.copied ? "copied ✓" : t.name
                    }}</span>
                  </Clipboard.Context>
                </span>
              </Clipboard.Trigger>
            </Clipboard.Root>
            <Popover.Context v-slot="api">
              <Popover.Trigger
                :value="t.path"
                :class="[s.infoTrigger, api.open && api.triggerValue === t.path && s.infoTriggerOpen]"
                :aria-label="`Values for ${t.name}`"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 7.6v.1" />
                </svg>
              </Popover.Trigger>
            </Popover.Context>
          </div>
        </div>
      </template>

      <Teleport to="body">
        <Popover.Positioner>
          <Popover.Content :class="s.info">
            <Popover.Context v-slot="api">
              <template v-if="api.triggerValue">
                <p :class="s.infoName">{{ props.ds.name(api.triggerValue) }}</p>
                <dl :class="s.infoList">
                  <template v-for="st in statesOf(api.triggerValue)" :key="st.condition ?? 'base'">
                    <dt :class="s.infoTerm">
                      <span :class="s.infoSwatch" :style="{ background: st.value }" />
                      {{ conditionOf(st) }}
                    </dt>
                    <dd :class="s.infoValue">{{ st.value }}</dd>
                  </template>
                </dl>
              </template>
            </Popover.Context>
          </Popover.Content>
        </Popover.Positioner>
      </Teleport>
    </Popover.Root>
  </div>

  <div v-else-if="renderer === 'layers'" :class="s.layers">
    <Clipboard.Root
      v-for="(t, i) in layerRows"
      :key="t.name"
      :default-value="t.name"
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
      :default-value="t.name"
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
      :default-value="t.name"
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
              v-if="category === 'radii'"
              :class="s.radiusBox"
              :style="{ borderRadius: t.value }"
            />
            <span v-else :class="s.lane"
              ><span :class="s.bar" :style="{ width: barWidth(t.value) }"
            /></span>
          </template>
          <span
            v-else-if="renderer === 'ramp' && category === 'lineHeights'"
            :class="s.lineHeightSpecimen"
            :style="{ lineHeight: t.value }"
            >{{ props.preview }}</span
          >
          <span
            v-else-if="renderer === 'ramp'"
            :class="s.specimen"
            :style="{
              fontSize: category === 'fontSizes' ? t.value : '17px',
              letterSpacing: category === 'letterSpacings' ? t.value : 'normal',
              fontWeight: category === 'fontWeights' ? t.value : '400',
            }"
            >{{ props.preview }}</span
          >
          <span
            v-else-if="renderer === 'box'"
            :class="[s.boxDemo, category === 'shadows' && s.boxDemoLight]"
            :style="category === 'shadows' ? { boxShadow: t.value } : { border: t.value }"
            >Aa</span
          >
          <span
            v-else-if="renderer === 'motion'"
            :class="s.motionChip"
            :style="
              category === 'animations'
                ? { animation: t.value }
                : category === 'durations'
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
