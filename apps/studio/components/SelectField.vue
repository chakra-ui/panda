<script setup lang="ts">
import { computed } from 'vue'
import { Select, createListCollection } from '@ark-ui/vue/select'
import { select } from 'styled-system/recipes'

const props = defineProps<{
  label: string
  items: { label: string; value: string }[]
  value: string
}>()
const emit = defineEmits<{ change: [value: string] }>()

const classes = select()
const collection = computed(() => createListCollection({ items: props.items }))
</script>

<template>
  <Select.Root
    :class="classes.root"
    :collection="collection"
    :model-value="[value]"
    :positioning="{ sameWidth: true, gutter: 4 }"
    @value-change="(d) => emit('change', d.value[0] ?? '')"
  >
    <Select.Label :class="classes.label">{{ label }}</Select.Label>
    <Select.Control :class="classes.control">
      <Select.Trigger :class="classes.trigger">
        <span :class="classes.prefix" aria-hidden="true">{{ label }}</span>
        <Select.ValueText :class="classes.value" :placeholder="items[0]?.label" />
        <Select.Indicator :class="classes.indicator">
          <Icon name="chevronsUpDown" :size="13" />
        </Select.Indicator>
      </Select.Trigger>
    </Select.Control>
    <Teleport to="body">
      <Select.Positioner>
        <Select.Content :class="classes.content">
          <Select.Item v-for="item in collection.items" :key="item.value" :item="item" :class="classes.item">
            <Select.ItemIndicator :class="classes.itemIndicator">
              <Icon name="check" :size="13" :stroke-width="2.5" />
            </Select.ItemIndicator>
            <Select.ItemText>{{ item.label }}</Select.ItemText>
          </Select.Item>
        </Select.Content>
      </Select.Positioner>
    </Teleport>
  </Select.Root>
</template>
