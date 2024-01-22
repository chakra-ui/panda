---
'@pandacss/core': patch
---

Fix the issue in the utility configuration where shorthand without `className` returns incorrect CSS when using the
shorthand version.

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
