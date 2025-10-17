---
'@pandacss/core': patch
'@pandacss/node': patch
'@pandacss/fixture': patch
'@pandacss/generator': patch
'@pandacss/postcss': patch
---

Fix "Browserslist: caniuse-lite is outdated" warning by updating `browserslist` and PostCSS-related packages:

- Update `browserslist` from 4.23.3 to 4.24.4
- Update `postcss` from 8.4.49 to 8.5.6
- Update `postcss-nested` from 6.0.1 to 7.0.2
- Update `postcss-merge-rules` from 7.0.4 to 7.0.6
- Update other PostCSS plugins to latest patch versions

This resolves the outdated `caniuse-lite` warning that appeared when using lightningcss without affecting CSS output or
requiring snapshot updates.
