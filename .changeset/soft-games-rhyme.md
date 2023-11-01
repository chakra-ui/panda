---
'@pandacss/generator': patch
---

Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for the
property 'display') and throwing when using anything else than those, if no theme tokens was found on that property.

Before:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ❌ didn't throw even though 'abc' is not a valid value for 'display'
```

Now:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ✅ will throw since 'abc' is not a valid value for 'display'
```
