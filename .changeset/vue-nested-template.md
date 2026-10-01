---
'@pandacss/compiler': patch
---

Fix styles in a Vue template being ignored when they came after a nested `<template>`, such as a `v-if` group or a slot.
