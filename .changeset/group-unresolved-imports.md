---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Speed up watch updates when many files import the same missing module. Panda now checks that import once when the module is added, then refreshes every affected file.
