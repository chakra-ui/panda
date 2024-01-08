---
'@pandacss/generator': patch
---

In version
[0.19.0 we changed `config.strictTokens`](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0190---2023-11-24)
typings a bit so that the only property values allowed were the config tokens OR the predefined CSS values, ex: `flex`
for the property `display`, which prevented typos such as `display: 'aaa'`.

The problem with this change is that it means you would have to provide every CSS properties a given set of values so
that TS wouldn't throw any error. Thus, we will partly revert this change and make it so that `config.strictTokens`
shouldn't affect properties that do not have config tokens, such as `content`, `willChange`, `display`, etc.

v0.19.0:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ❌ would throw since 'abc' is not part of predefined values of 'display' even thought there is no config token for 'abc'
```

now:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ✅ will not throw there is no config token for 'abc'
```
