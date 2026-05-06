---
'@pandacss/astro-plugin-studio': patch
'@pandacss/studio': patch
---

Bump `astro` to `6.2.2`, `vite` to `7.3.2`, and `@astrojs/react` to `5.0.4` to pull in upstream security fixes (XSS in `astro` `define:vars` [CVE-2026-41067], path traversal and `server.fs.deny` bypass in `vite` [CVE-2026-39365, CVE-2026-39364], and SVGO Billion-Laughs DoS [CVE-2026-29074]).
