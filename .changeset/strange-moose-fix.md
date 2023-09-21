---
'@pandacss/config': patch
---

> Note: This is only relevant for users using more than 1 custom defined preset that overlap with each other.

BREAKING CHANGE: Presets merging order felt wrong (left overriding right presets) and is now more intuitive (right
overriding left presets)

Example:

```ts
const firstConfig = definePreset({
  theme: {
    tokens: {
      colors: {
        'first-main': { value: 'override' },
      },
    },
    extend: {
      tokens: {
        colors: {
          orange: { value: 'orange' },
          gray: { value: 'from-first-config' },
        },
      },
    },
  },
})

const secondConfig = definePreset({
  theme: {
    tokens: {
      colors: {
        pink: { value: 'pink' },
      },
    },
    extend: {
      tokens: {
        colors: {
          blue: { value: 'blue' },
          gray: { value: 'gray' },
        },
      },
    },
  },
})

// Final config
export default defineConfig({
  presets: [firstConfig, secondConfig],
})
```

Here's the difference between the old and new behavior:

```diff
{
  "theme": {
    "tokens": {
      "colors": {
        "blue": {
          "value": "blue"
        },
-        "first-main": {
-          "value": "override"
-        },
        "gray": {
-          "value": "from-first-config"
+          "value": "gray"
        },
        "orange": {
          "value": "orange"
        },
+        "pink": {
+            "value": "pink",
+        },
      }
    }
  }
}
```
