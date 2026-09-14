<script setup lang="ts">
import { computed, watch } from "vue";
import { Tabs } from "@ark-ui/vue/tabs";
import { Field } from "@ark-ui/vue/field";
import * as s from "./TokenView.styles";
import { button, control } from "styled-system/recipes";
import {
  hasPreview,
  PREVIEW_TEXT,
  themeNames,
  wantsLargePreview,
  type DesignSystemIndex,
} from "~/utils/design-system";

const props = defineProps<{
  ds: DesignSystemIndex;
  usage?: unknown;
  analyzeHref?: string;
}>();
defineEmits<{ reset: [] }>();

const route = useRoute();
const router = useRouter();

/** Query params are the source of truth, so any view can be shared as a link. */
const setQuery = (patch: Record<string, string | undefined>) =>
  router.replace({ query: { ...route.query, ...patch } });

const param = (key: string) => {
  const value = route.query[key];
  return typeof value === "string" ? value : undefined;
};

const { status: shareStatus, share } = useShareSpec();
const analyzeLabel = computed(() => (props.usage ? "View usage" : "Analyze usage"));
const analyzeTo = computed(
  () => `${props.analyzeHref ?? "/analyze"}?category=${encodeURIComponent(activeType.value)}`,
);

const categories = computed(() =>
  props.ds.categories().map((type) => ({ type, count: props.ds.categoryPaths(type).length })),
);
const defaultType = computed(
  () => categories.value.find((c) => c.type === "colors")?.type ?? categories.value[0]?.type ?? "",
);
const activeType = computed({
  get() {
    const wanted = param("category");
    return wanted && categories.value.some((c) => c.type === wanted) ? wanted : defaultType.value;
  },
  set: (type) => setQuery({ category: type === defaultType.value ? undefined : type, search: undefined }),
});

const active = computed(() => categories.value.find((c) => c.type === activeType.value));

/** An exclusive identity: you are in one theme at a time. */
const themes = computed(() => themeNames(props.ds));
const theme = computed({
  get() {
    const wanted = param("theme");
    return wanted && themes.value.includes(wanted) ? wanted : "";
  },
  set: (name) => setQuery({ theme: name || undefined }),
});

const search = computed({
  get: () => param("q") ?? "",
  set: (value) => setQuery({ q: value || undefined }),
});

/** Typography tokens are judged against real copy, so let the reader supply it. */
const showPreview = computed(() => hasPreview(activeType.value));
const largePreview = computed(() => wantsLargePreview(activeType.value));
const previewDefault = computed(() => PREVIEW_TEXT[activeType.value] ?? "");
const previewText = computed({
  get: () => param("text") ?? previewDefault.value,
  set: (value) => setQuery({ text: value && value !== previewDefault.value ? value : undefined }),
});

watch(activeType, () => setQuery({ q: undefined, text: undefined }));
</script>

<template>
  <Tabs.Root
    v-model="activeType"
    orientation="vertical"
    :class="s.root"
  >
    <Tabs.List :class="s.rail" aria-label="Token categories">
      <div v-if="themes.length" :class="s.railTheme">
        <ThemeSelect
          :themes="themes"
          :theme="theme"
          @change="(value: string) => (theme = value)"
        />
      </div>
      <div :class="s.railHead">Categories</div>
      <Tabs.Trigger v-for="cat in categories" :key="cat.type" :value="cat.type" :class="s.tab">
        <span>{{ cat.type }}</span>
        <span :class="s.count">{{ cat.count }}</span>
      </Tabs.Trigger>
    </Tabs.List>

    <div :class="s.main">
      <div :class="s.toolbar">
        <div>
          <h1 :class="s.title">{{ active?.type }}</h1>
          <p :class="s.subtitle">
            {{ active?.count }} tokens · click any token to copy its name
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
            @click="share(props.ds.spec, { usage: props.usage })"
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

      <div v-if="showPreview" :class="s.previewBar">
        <Field.Root :class="s.searchField">
          <Field.Label :class="s.srOnly">Preview text</Field.Label>
          <Field.Textarea
            v-if="largePreview"
            :class="[control({ kind: 'textarea' }), s.previewArea]"
            v-model="previewText"
            rows="3"
            placeholder="Preview text…"
          />
          <Field.Input
            v-else
            :class="[control({ kind: 'search' }), s.searchInput]"
            v-model="previewText"
            placeholder="Preview text…"
          />
        </Field.Root>
      </div>

      <div v-if="themes.length" :class="s.themeBarMobile">
        <ThemeSelect :themes="themes" :theme="theme" @change="(value: string) => (theme = value)" />
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

      </div>

      <Tabs.Content
        v-for="cat in categories"
        :key="cat.type"
        :value="cat.type"
        :lazy-mount="true"
        :unmount-on-exit="true"
      >
        <TokenGrid
          :ds="props.ds"
          :category="cat.type"
          :theme="theme"
          :search="search"
          :preview="previewText"
        />
      </Tabs.Content>
    </div>
  </Tabs.Root>
</template>
