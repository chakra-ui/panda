<script setup lang="ts">
import { computed } from "vue";
import { Select, createListCollection } from "@ark-ui/vue";
import { select } from "styled-system/recipes";

const props = defineProps<{ categories: string[]; category: string }>();
const emit = defineEmits<{ change: [value: string] }>();

const cls = select();
const collection = computed(() =>
  createListCollection({
    items: [
      { label: "All categories", value: "" },
      ...props.categories.map((c) => ({ label: c, value: c })),
    ],
  }),
);
</script>

<template>
  <Select.Root
    :class="cls.root"
    :collection="collection"
    :model-value="[category]"
    @value-change="(d) => emit('change', d.value[0] ?? '')"
  >
    <Select.Label :class="cls.label">Category</Select.Label>
    <Select.Control>
      <Select.Trigger :class="cls.trigger">
        <Select.ValueText placeholder="All categories" />
        <Select.Indicator :class="cls.indicator">
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
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Select.Indicator>
      </Select.Trigger>
    </Select.Control>
    <Teleport to="body">
      <Select.Positioner>
        <Select.Content :class="cls.content">
          <Select.Item
            v-for="item in collection.items"
            :key="item.value"
            :item="item"
            :class="cls.item"
          >
            <Select.ItemText>{{ item.label }}</Select.ItemText>
            <Select.ItemIndicator :class="cls.itemIndicator">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Content>
      </Select.Positioner>
    </Teleport>
  </Select.Root>
</template>
