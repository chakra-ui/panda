---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

In recipes and `globalCss`, the later key now wins when two keys set the same CSS property, as in v1.

- Shorthands and utilities follow key order: `{ bgColor: 'red', backgroundColor: 'blue' }` gives `blue`.
- `textStyle`, `layerStyle` and `animationStyle` expand in place, so a property must come after them to override them:

  ```ts
  { color: 'blue', textStyle: 'body' } // the text style's color
  { textStyle: 'body', color: 'blue' } // blue
  ```

- Design systems need to rerun `panda lib` to regenerate their build info.
