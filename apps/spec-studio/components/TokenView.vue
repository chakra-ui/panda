<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Tabs, Field } from "@ark-ui/vue";
import * as s from "./TokenView.styles";
import { button, control, segment } from "styled-system/recipes";
import type { TokensFile } from "~/utils/tokens";
import type { Variant } from "~/utils/token-model";

const props = defineProps<{
  file: TokensFile;
  resolveVars?: boolean;
  variants?: Variant[];
  css?: string | null;
  usage?: unknown;
  analyzeHref?: string;
}>();
defineEmits<{ reset: [] }>();

const { status: shareStatus, share } = useShareSpec();
const analyzeLabel = computed(() => (props.usage ? "View usage" : "Analyze usage"));
const analyzeTo = computed(
  () => `${props.analyzeHref ?? "/analyze"}?category=${encodeURIComponent(activeType.value)}`,
);

const activeVariant = ref<Variant | undefined>(props.variants?.[0]);
watch(
  () => props.variants,
  (v) => (activeVariant.value = v?.[0]),
);

const viewMode = ref<"grid" | "matrix">("grid");
const canMatrix = computed(
  () => activeType.value === "colors" && (props.variants?.length ?? 0) > 1,
);

const categories = computed(() => props.file.data);
const activeType = ref(
  (categories.value.find((c) => c.type === "colors") ?? categories.value[0])?.type ?? "",
);
const search = ref("");
const active = computed(
  () => categories.value.find((c) => c.type === activeType.value) ?? categories.value[0],
);

watch(activeType, () => (search.value = ""));
</script>

<template>
  <Tabs.Root
    v-model="activeType"
    orientation="vertical"
    :class="[s.root, activeVariant?.class]"
    v-bind="activeVariant?.attrs"
  >
    <Tabs.List :class="s.rail" aria-label="Token categories">
      <div :class="s.railHead">Categories</div>
      <Tabs.Trigger v-for="cat in categories" :key="cat.type" :value="cat.type" :class="s.tab">
        <span>{{ cat.type }}</span>
        <span :class="s.count">{{ cat.values.length }}</span>
      </Tabs.Trigger>
    </Tabs.List>

    <div :class="s.main">
      <div :class="s.toolbar">
        <div>
          <h1 :class="s.title">{{ active?.type }}</h1>
          <p :class="s.subtitle">
            {{ active?.values.length }} tokens · click any token to copy its name
          </p>
        </div>
        <div :class="s.actions">
          <NuxtLink
            :to="analyzeTo"
            :class="[button({ variant: 'solid', size: 'sm' }), s.actionGrow]"
            title="See which tokens are used, unused, and hot"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M18 17V9M13 17V5M8 17v-3" />
            </svg>
            {{ analyzeLabel }}
          </NuxtLink>
          <button
            :class="[button({ variant: 'outline', size: 'sm' }), s.shareBtn]"
            :disabled="shareStatus === 'sharing'"
            aria-label="Share"
            title="Create a shareable link to this system"
            @click="share(props.file, props.css ?? null, { usage: props.usage })"
          >
            <span v-if="shareStatus === 'sharing'" :class="s.btnSpinner" />
            <svg
              v-else
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
            <span :class="s.shareText">Share</span>
          </button>
          <button :class="[button({ variant: 'outline', size: 'sm' }), s.actionFull]" @click="$emit('reset')">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M17 8l-5-5-5 5" />
              <path d="M12 3v13" />
            </svg>
            Load another system
          </button>
        </div>
      </div>

      <div :class="s.filterbar">
        <Field.Root :class="s.searchField">
          <Field.Label :class="s.srOnly">Filter tokens by name</Field.Label>
          <Field.Input
            :class="[control({ kind: 'search' }), s.searchInput]"
            v-model="search"
            type="search"
            placeholder="Filter by name…"
          />
        </Field.Root>
        <div
          v-if="(props.variants?.length ?? 0) > 1"
          :class="s.variants"
          role="group"
          aria-label="Theme"
        >
          <button
            v-for="v in props.variants"
            :key="v.id"
            :class="segment({ active: v.id === activeVariant?.id })"
            @click="activeVariant = v"
          >
            {{ v.label }}
          </button>
        </div>
        <div v-if="canMatrix" :class="s.variants" role="group" aria-label="Layout">
          <button :class="segment({ active: viewMode === 'grid' })" @click="viewMode = 'grid'">
            Grid
          </button>
          <button :class="segment({ active: viewMode === 'matrix' })" @click="viewMode = 'matrix'">
            Matrix
          </button>
        </div>
      </div>

      <Tabs.Content
        v-for="cat in categories"
        :key="cat.type"
        :value="cat.type"
        :lazy-mount="true"
        :unmount-on-exit="true"
      >
        <MatrixView
          v-if="viewMode === 'matrix' && cat.type === 'colors'"
          :category="cat"
          :variants="props.variants ?? []"
        />
        <TokenGrid v-else :category="cat" :search="search" :resolve-vars="props.resolveVars" />
      </Tabs.Content>
    </div>
  </Tabs.Root>
</template>
