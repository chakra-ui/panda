---
'@pandacss/preset-base': minor
---

Fix `rotateX`, `rotateY`, and `rotateZ`, which applied the wrong rotation or none at all. They fed the `rotate` property, which holds one rotation, so a single axis came out as a flat 2D spin and two axes computed to `none`. `rotate: 'auto'` now composes them on `transform`; plain values like `rotate: '45deg'` still use `rotate`.

```ts
css({ rotate: 'auto', rotateX: '45deg', rotateY: '30deg' }) // both apply
```

**Breaking:** `translateZ` no longer accepts fractions. `translate`'s third slot rejects a percentage, so `translateZ: '1/2'` invalidated the whole declaration and dropped x and y with it. Use a spacing token or a length.

Two consequences of composing on `transform`: a raw `transform` value overrides `rotate: 'auto'`, so write both functions yourself if you need them together, and with a non-uniform `scale` the rotation applies after scaling rather than before.
