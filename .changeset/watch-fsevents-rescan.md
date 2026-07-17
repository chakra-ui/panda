---
'@pandacss/cli': patch
---

Fix `panda --watch` crashing on macOS when FSEvents drops events. The watcher now re-scans instead of exiting.
