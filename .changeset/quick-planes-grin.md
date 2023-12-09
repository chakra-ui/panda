---
'@pandacss/core': patch
'@pandacss/node': patch
---

Improve initial css extraction time by at least 5x 🚀

Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

**Scenarios**

- Park UI went from 3500ms to 580ms (6x faster)
- Panda Website went from 2900ms to 208ms (14x faster)

**Potential Breaking Change**

If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css` string
for performance reasons. We might reconsider this in the future.
