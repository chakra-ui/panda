---
'@pandacss/core': patch
---

Fix issue in utility config where shorthands without `className` returns incorrect css when use the shorthand version.

```js
utilities: {
  extend: {
    coloredBorder: {
      shorthand: 'cb', // no classname, returns incorrect css
      values: ['red', 'green', 'blue'],
      transform(value) {
        return {
          border: `1px solid ${value}`,
        };
      },
    },
  },
},
```
