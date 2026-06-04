---
'@pandacss/config': patch
---

Inline the config bundler (previously the `bundle-n-require` dependency) and fix a misleading error when a config fails
to load.

When loading the bundled config, the loader fell back to evaluating the code without a filename. Any config that errored
during load then surfaced `Please pass in filename to use require` (a single `node:` builtin in the bundled output was
enough to trigger it) instead of the real error. It showed up most often under bun. The fallback now compiles with the
real config path, so `require()` resolves and the actual error is reported.
