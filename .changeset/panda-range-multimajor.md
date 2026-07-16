---
'@pandacss/compiler-shared': patch
---

Accept real-world `panda` peer ranges when validating a design system: multi-major `||` unions (`^2.0.0 || ^3.0.0`), wildcards (`*`, the range `panda lib` writes by default), open lower bounds (`>=2`), and hyphen ranges (`2.0.0 - 3.0.0`). A consumer on a compatible major now hydrates instead of failing closed. Unresolved protocol ranges like `catalog:` still fail closed.
