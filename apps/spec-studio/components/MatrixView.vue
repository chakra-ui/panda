<script setup lang="ts">
import { computed } from "vue";
import * as s from "./MatrixView.styles";
import { isSemantic } from "~/utils/token-model";
import type { Variant } from "~/utils/token-model";
import type { Category } from "~/utils/tokens";

const props = defineProps<{ category: Category; variants: Variant[] }>();

const rows = computed(() => props.category.values.filter((t) => isSemantic(t.value)));
</script>

<template>
  <p v-if="!rows.length" :class="s.empty">
    No semantic tokens in {{ category.type }} — the matrix compares tokens that change across
    themes.
  </p>
  <div v-else :class="s.scroll">
    <table :class="s.table">
      <thead>
        <tr>
          <th :class="s.thToken">token</th>
          <th v-for="v in variants" :key="v.id" :class="s.th">{{ v.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in rows" :key="t.name">
          <td :class="s.tdToken">{{ t.name }}</td>
          <td v-for="v in variants" :key="v.id" :class="s.td">
            <span :class="v.class" v-bind="v.attrs">
              <span :class="s.swatch" :style="{ background: t.value }" />
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
