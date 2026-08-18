---
'@pandacss/types': minor
'@pandacss/config': minor
'@pandacss/preset-base': patch
---

Add `globalVars` to utility definitions, so a variable's `@property` registration lives next to the utility that writes it. Registrations merge into the config-level `globalVars` and are pruned when unused.

```ts
utilities: {
  blur: {
    className: 'blur',
    globalVars: { '--blur': { syntax: '*', inherits: false } },
    transform: (value) => ({ '--blur': `blur(${value})` }),
  },
}
```

Putting a plain value on a name a utility registered warns during CSS emit, but only when your stylesheet actually reads that variable, since the value drops the registration and starts the variable inheriting. Pass a full `@property` object to retune one instead. Two utilities registering the same name with different definitions is a config error.
