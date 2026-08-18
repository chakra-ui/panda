---
'@pandacss/preset-base': minor
---

Register the variables behind `translate`, `rotate`, `scale`, gradients, filters, scrollbars, and table spacing with `@property`, replacing the `*, ::before, ::after, ::backdrop` reset that gave them defaults. The reset shipped 34 declarations on every element of every page; the registrations only emit when your stylesheet references them, and `inherits: false` stops a parent's filter or fade reaching its children.

Needs `@property` support (Chrome 85+, Safari 16.4+, Firefox 128+). Set `optimize.propertyFallback` to keep these utilities working on older engines.
