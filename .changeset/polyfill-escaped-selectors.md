---
'@pandacss/compiler': patch
---

Fix `polyfill: true` producing broken CSS for class names with escaped characters such as `:`, `,`, `"`, or `#`:

```ts
css({ animation: 'fadeIn 1s, slideUp 1s' })
// before: .animation_fadeIn_1s\:not(#\#),_slideUp_1s:not(#\#)
// after:  .animation_fadeIn_1s\,_slideUp_1s:not(#\#)
```
