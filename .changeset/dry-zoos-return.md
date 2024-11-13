---
'@pandacss/preset-base': minor
---

[Breaking] Remove default utility values for `gridTemplateColumns`, `gridTemplateRows`, `gridColumn` and `gridRow` to
prevent interference with native css values.

For example `1` or `2` is a valid native value for `gridColumn` or `gridRow`, and should not be overridden by the
utility.

Find the previous default values below, you can add them back to your config if you need them.

```ts
const utilities = {
  gridTemplateColumns: {
    className: 'grid-tc',
    group: 'Grid Layout',
    values: {
      '1': 'repeat(1, minmax(0, 1fr))',
      '2': 'repeat(2, minmax(0, 1fr))',
      '3': 'repeat(3, minmax(0, 1fr))',
      '4': 'repeat(4, minmax(0, 1fr))',
      '5': 'repeat(5, minmax(0, 1fr))',
      '6': 'repeat(6, minmax(0, 1fr))',
      '7': 'repeat(7, minmax(0, 1fr))',
      '8': 'repeat(8, minmax(0, 1fr))',
      '9': 'repeat(9, minmax(0, 1fr))',
      '10': 'repeat(10, minmax(0, 1fr))',
      '11': 'repeat(11, minmax(0, 1fr))',
      '12': 'repeat(12, minmax(0, 1fr))',
    },
  },
  gridTemplateRows: {
    className: 'grid-tr',
    group: 'Grid Layout',
    values: {
      '1': 'repeat(1, minmax(0, 1fr))',
      '2': 'repeat(2, minmax(0, 1fr))',
      '3': 'repeat(3, minmax(0, 1fr))',
      '4': 'repeat(4, minmax(0, 1fr))',
      '5': 'repeat(5, minmax(0, 1fr))',
      '6': 'repeat(6, minmax(0, 1fr))',
      '7': 'repeat(7, minmax(0, 1fr))',
      '8': 'repeat(8, minmax(0, 1fr))',
      '9': 'repeat(9, minmax(0, 1fr))',
      '10': 'repeat(10, minmax(0, 1fr))',
      '11': 'repeat(11, minmax(0, 1fr))',
      '12': 'repeat(12, minmax(0, 1fr))',
    },
  },
  gridColumn: {
    className: 'grid-c',
    group: 'Grid Layout',
    values: {
      full: '1 / -1',
      '1': 'span 1 / span 1',
      '2': 'span 2 / span 2',
      '3': 'span 3 / span 3',
      '4': 'span 4 / span 4',
      '5': 'span 5 / span 5',
      '6': 'span 6 / span 6',
      '7': 'span 7 / span 7',
      '8': 'span 8 / span 8',
      '9': 'span 9 / span 9',
      '10': 'span 10 / span 10',
      '11': 'span 11 / span 11',
      '12': 'span 12 / span 12',
    },
  },
  gridRow: {
    className: 'grid-r',
    group: 'Grid Layout',
    values: {
      full: '1 / -1',
      '1': 'span 1 / span 1',
      '2': 'span 2 / span 2',
      '3': 'span 3 / span 3',
      '4': 'span 4 / span 4',
      '5': 'span 5 / span 5',
      '6': 'span 6 / span 6',
      '7': 'span 7 / span 7',
      '8': 'span 8 / span 8',
      '9': 'span 9 / span 9',
      '10': 'span 10 / span 10',
      '11': 'span 11 / span 11',
      '12': 'span 12 / span 12',
    },
  },
}
```
