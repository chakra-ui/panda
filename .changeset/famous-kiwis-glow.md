---
'@pandacss/preset-base': minor
---

Add support for `bgLinear`, `bgRadial` and `bgConic` properties.

### `bgLinear`

```tsx
<div
  className={css({
    bgLinear: 'to-r',
    gradientFrom: 'cyan.500',
    gradientTo: 'blue.500',
  })}
/>
```

### `bgRadial`

```tsx
<div
  className={css({
    bgRadial: 'in srgb',
    gradientFrom: 'pink.400',
    gradientFromPosition: '40%',
    gradientTo: 'fuchsia.700',
  })}
/>
```

### `bgConic`

```tsx
<div
  className={css({
    bgConic: 'in srgb',
    gradientFrom: 'blue.600',
    gradientTo: 'sky.400',
    gradientToPosition: '50%',
  })}
/>
```

Add support for `boxSize` property that maps to `width` and `height` properties.

```tsx
<div className={css({ boxSize: '24' })} />
```
