---
'@pandacss/node': patch
---

Fix styles disappearing after a config change in Vue and Svelte projects. Editing your config rebuilt the context without the built-in Vue/Svelte plugins, so those files stopped producing CSS until you restarted the dev server. The reload now keeps them.
