<script setup lang="ts">
import { computed } from "vue";
import * as s from "./MatrixView.styles";
import { matrix } from "styled-system/recipes";
import { isSemantic } from "~/utils/token-model";
import type { Variant } from "~/utils/token-model";
import type { Category } from "~/utils/tokens";

const props = defineProps<{ category: Category; variants: Variant[] }>();

const m = matrix();
const rows = computed(() => props.category.values.filter((t) => isSemantic(t.value)));
</script>

<template>
  <p v-if="!rows.length" :class="s.empty">
    No semantic tokens in {{ category.type }} — the matrix compares tokens that change across
    themes.
  </p>
  <div v-else :class="m.scroll">
    <table :class="m.root">
      <thead>
        <tr>
          <th :class="m.rowHead">token</th>
          <th v-for="v in variants" :key="v.id" :class="m.colHead">{{ v.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in rows" :key="t.name">
          <td :class="m.rowCell">{{ t.name }}</td>
          <td v-for="v in variants" :key="v.id" :class="m.cell">
            <span :class="v.class" v-bind="v.attrs">
              <span :class="m.swatch" :style="{ background: t.value }" />
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
