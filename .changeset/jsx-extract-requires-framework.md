---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Stop generating dead CSS from non-Panda components when you haven't set `jsxFramework`.

Before, a third-party tag like astro's `<Image width="900" height="800" />` was read as style props and emitted `.w_900` / `.h_800`. Now the "any uppercase component" rule only kicks in when `jsxFramework` is set, same as v1, which didn't extract JSX style props without a framework. Your real Panda components, and any project that sets `jsxFramework`, are unchanged. The fix covers `.tsx`, `.astro`, `.vue`, and `.svelte`.
