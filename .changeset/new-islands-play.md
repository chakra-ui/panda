---
'@pandacss/shared': patch
---

Fix issue where the `walkObject` shared helper would set an object key to a nullish value

Example:

```ts
const shorthands = {
  flexDir: 'flexDirection',
}

const obj = {
  flexDir: 'row',
  flexDirection: undefined,
}

const result = walkObject(obj, (value) => value, {
  getKey(prop) {
    return shorthands[prop] ?? prop
  },
})
```

This would set the `flexDirection` to `row` (using `getKey`) and then set the `flexDirection` property again, this time
to `undefined`, since it existed in the original object
