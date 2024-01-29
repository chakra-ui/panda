---
'@pandacss/config': patch
---

Using `null` in one of the extendable keys will omit that key from the final config. This is useful for when you want to
use most of a preset but want to completely omit a few things, while keeping the rest.

```ts
const myPreset = {
  theme: {
    extend: {
      tokens: {
        colors: {
          blue: { value: 'blue' },
          orange: { value: 'orange' },
        },
      },
    },
  },
  utilities: {
    extend: {
      gridRow: {
        className: 'row-span',
        values: {
          full: '1 / -1',
          1: 'span 1 / span 1',
          2: 'span 2 / span 2',
          3: 'span 3 / span 3',
          4: 'span 4 / span 4',
          5: 'span 5 / span 5',
          6: 'span 6 / span 6',
          7: 'span 7 / span 7',
          8: 'span 8 / span 8',
          9: 'span 9 / span 9',
          10: 'span 10 / span 10',
          11: 'span 11 / span 11',
          12: 'span 12 / span 12',
        },
      },
    },
  },
  patterns: {
    extend: {
      box: {
        transform(props) {
          return props
        },
      },
      visuallyHidden: {
        transform(props) {
          return {
            srOnly: true,
            ...props,
          }
        },
      },
    },
  },
}

export default defineConfig({
  presets: [myPreset],
  theme: {
    extend: {
      tokens: {
        colors: {
          red: { value: 'green' },
          blue: { value: 'yellow' },
          // @ts-expect-error
          orange: null,
        },
      },
    },
  },
  utilities: {
    extend: {
      gridRow: {
        className: 'row-span',
        // @ts-expect-error
        values: {
          full: '1 / -1',
          1: null,
          2: null,
          3: null,
          4: null,
          5: null,
          6: null,
          7: null,
          8: null,
          9: null,
        },
      },
    },
  },
  patterns: {
    extend: {
      // @ts-expect-error
      visuallyHidden: null,
    },
  },
})
```

will result in:

```ts
export default {
  theme: {
    tokens: {
      colors: {
        blue: {
          value: 'yellow',
        },
        red: {
          value: 'green',
        },
      },
    },
  },
  utilities: {
    gridRow: {
      className: 'row-span',
      values: {
        10: 'span 10 / span 10',
        11: 'span 11 / span 11',
        12: 'span 12 / span 12',
        full: '1 / -1',
      },
    },
  },
}
```
