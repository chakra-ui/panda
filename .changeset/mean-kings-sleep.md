---
'@pandacss/generator': patch
---

Fix `config.staticCss` by filtering types on getPropertyKeys

It used to throw because of them:

```bash
<css input>:33:21: Missed semicolon
 ELIFECYCLE  Command failed with exit code 1.
```

```css
@layer utilities {
    .m_type\:Tokens\[\"spacing\"\] {
        margin: type:Tokens["spacing"]
    }
}
```
