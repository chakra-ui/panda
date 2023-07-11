---
'@pandacss/language-server': patch
'panda-css-vscode': patch
---

Pin prettier version in LSP because prettier v3 is incompatible with prettier/parser-postcss
https://github.com/prettier/prettier/issues/14814

and also disable extension in astro/svelte/vue files until we figured out how to map transformed file AST nodes to their original positions
