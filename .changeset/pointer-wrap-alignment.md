---
'@pandacss/preset-base': minor
'@pandacss/compiler': patch
---

Add conditions for pointer type (`_pointerFine`, `_pointerCoarse`, `_pointerNone`, and the `_anyPointer*` variants), post-interaction validity (`_userValid`, `_userInvalid`), and `_inert`.

```ts
css({
  color: { _pointerFine: 'blue.500' },
  borderColor: { _userInvalid: 'red.500' },
  opacity: { _inert: '0.5' },
})
```

`textWrap` now takes every CSS keyword, including `pretty` and `stable`. Generated types also include the two-word alignment keywords `safe center`, `safe end`, `safe start`, `first baseline`, and `last baseline`.

```ts
css({ textWrap: 'pretty', justifyContent: 'safe center', alignItems: 'last baseline' })
```
