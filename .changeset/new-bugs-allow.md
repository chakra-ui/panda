---
'@pandacss/generator': patch
'@pandacss/types': patch
---

This change allows the user to set `jsxFramework` to any string to enable extracting JSX components.

---

Context: In a previous version, Panda's extractor used to always extract JSX style props even when not specifying a
`jsxFramework`. This was considered a bug and has been fixed, which reduced the amount of work panda does and artifacts
generated if the user doesn't need jsx.

Now, in some cases like when using Svelte or Astro, the user might still to use & extract JSX style props, but the
`jsxFramework` didn't have a way to specify that. This change allows the user to set `jsxFramework` to any string to
enable extracting JSX components without generating any artifacts.
