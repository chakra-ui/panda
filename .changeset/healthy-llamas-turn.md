---
'@pandacss/extractor': patch
---

Fix extractor behaviour when encoutering operation tokens, try to evaluate them instead of resolving them as string

before:

```tsx
<AspectRatio ratio={1 / 2} asterisk={1 * 5} exp={1 ** 4} minus={5 - 1} />
```

would be extracted to:

````json
{
    "asterisk": "1 *5",
    "exp": "1**4",
    "minus": "5 -1",
    "ratio": "1 / 2",
}

now, it will be extracted to the actual values:
```json
{
    "asterisk": 5,
    "exp": 1,
    "minus": 4,
    "ratio": 0.5,
}
````
