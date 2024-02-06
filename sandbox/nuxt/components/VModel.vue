<script setup lang="ts">
import { ref } from 'vue'
import { cva } from '../styled-system/css'
import { styled, VStack } from '../styled-system/jsx'

const CustomInputStyle = cva({
  base: {
    bgColor: 'gray.200',
    px: '4',
    py: '2',
  },
})

const CustomJSXInput = styled('input', CustomInputStyle)

const jsxModel = ref('')
const nativeInputModel = ref('')
const styledModel = ref('')
</script>

<template>
  <VStack>
    <label>
      JSXModel:
      <CustomJSXInput v-model="jsxModel" />
      Result: {{ jsxModel }}
    </label>
    <label>
      Styled Component:
      <styled.input px="4" py="2" bgColor="gray.200" v-model="styledModel" />
      Result: {{ styledModel }}
    </label>
    <label>
      Native input element:
      <input v-model="nativeInputModel" :class="CustomInputStyle()" />
      Result: {{ nativeInputModel }}
    </label>
  </VStack>
</template>
