---
'@pandacss/generator': patch
---

### Spec

- Fixed issue in recipe specs where boolean variant values were incorrectly formatted with quotes (e.g.,
  `button({ primary: true })` instead of `button({ primary: 'true' })`)
- Updated color palette spec generation to dynamically discover and use actual available tokens
