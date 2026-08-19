---
'@pandacss/compiler': patch
---

Drop `globalVars` `@property` registrations the stylesheet never reads or writes, so a preset can register a whole utility family without charging projects that don't use it. Plain string `globalVars` still always emit.
