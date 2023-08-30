---
'@pandacss/generator': patch
---

Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it.

This is mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would use
it like `css({ ... }, cssProps)`
