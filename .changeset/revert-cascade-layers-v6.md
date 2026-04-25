---
'@pandacss/core': patch
---

Pin `@csstools/postcss-cascade-layers` back to `5.0.2`.

Version `6.0.0` dropped the CommonJS export and raised the engine requirement to Node `>=20.19.0`,
which broke `panda codegen` on Node 20.0–20.18 and Node 18 with `ERR_REQUIRE_ESM` (issue #3518).
Since `@pandacss/core` ships a CJS build that requires the package, we stay on the last
dual-published version. The two releases are functionally equivalent — v6 only removed CJS support.
