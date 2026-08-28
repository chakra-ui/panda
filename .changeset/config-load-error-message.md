---
'@pandacss/config': patch
---

Report config load failures against the config file instead of a base64 `data:` URL. A missing dependency now reads
`Cannot find package 'x' imported from …`, and your config is no longer evaluated twice on failure.
