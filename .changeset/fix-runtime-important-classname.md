---
'@pandacss/compiler': patch
---

Fix the runtime `css()` naming `!important` classes differently from cssgen, so the rule never matched.

`css({ padding: '0 !important' })` put `p_0_!important` on the element — the runtime hashed the whole string (`withoutSpace('0 !important')`) — but cssgen wrote `.p_0\!` (it strips `!important` and marks the class with a trailing `!`). The two never matched, so the `!important` declaration silently never applied. Same for `zIndex: '1002 !important'`, `whiteSpace: 'nowrap !important'`, `color: 'red.500 !important'`, etc.

The generated runtime now mirrors legacy Panda (and the native emitter): it detects `!important`, strips it before hashing the value, and appends a trailing `!` to the final class — `p_0!`, `z_1002!`, `c_red.500!` — exactly the class cssgen emits (`.p_0\!`). Adds `isImportant` / `withoutImportant` runtime helpers (matching `@pandacss/shared`'s `/\s*!(important)?/i`) and wires them into `createCssRuntime`'s `serializeCss`, so both `css({})` and `css\`\`` are fixed in one place.
