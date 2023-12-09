---
'@pandacss/core': patch
'@pandacss/node': patch
---

Improve initial css extraction time by at least 5x 🚀

Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

### Scenarios

- Park UI went from 3500ms to 580ms (6x faster)
- Website went from 2900ms to 208ms (14x faster)
