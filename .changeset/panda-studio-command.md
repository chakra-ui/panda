---
'@pandacss/cli': patch
'@pandacss/compiler-shared': patch
---

Add `panda studio`. It opens Panda Studio in your browser, connected to your project, and updates it as you save. Usage
comes from your full `panda.config`, the same as `panda analyze`.

```sh
panda studio            # opens http://localhost:6420
panda studio --no-open  # prints the link instead
```

The driver also gets `specJson()`, which returns the design-system document without writing a file.
