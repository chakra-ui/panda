<script setup lang="ts">
import { ref } from 'vue'
import { cva } from '../styled-system/css'
import { styled } from '../styled-system/jsx'

const CustomInputStyle = cva({
  base: {
    bgColor: 'gray.200',
    px: '4',
    py: '2',
  },
})

// const jsxModel = ref('');
const nativeInputModel = ref('')
const styledModel = ref('')
</script>

<template>
  <label>
    Styled Component:
    <styled.input px="4" py="2" bgColor="gray.200" v-model="styledModel" />
    <br />
    Result: {{ styledModel }}
  </label>
  <br />
  <label>
    Native input element:
    <input v-model="nativeInputModel" :class="CustomInputStyle()" />
    <br />
    Result: {{ nativeInputModel }}
  </label>
</template>
