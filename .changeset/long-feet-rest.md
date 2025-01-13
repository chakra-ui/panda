---
'@pandacss/preset-base': minor
---

Add support for new conditions

- `current` -> `&:is([aria-current=true], [data-current])`
- `today` -> `&[data-today]`
- `unavailable` -> `&[data-unavailable]`
- `rangeStart` -> `&[data-range-start]`
- `rangeEnd` -> `&[data-range-end]`
- `now` -> `&[data-now]`
- `topmost` -> `&[data-topmost]`
- `icon` -> `& :where(svg)`
- `complete` -> `&[data-complete]`
- `incomplete` -> `&[data-incomplete]`
- `dragging` -> `&[data-dragging]`
- `grabbed` -> `&[data-grabbed]`
- `underValue` -> `&[data-state=under-value]`
- `overValue` -> `&[data-state=over-value]`
- `atValue` -> `&[data-state=at-value]`
- `hidden` -> `&:is([hidden], [data-hidden])`
