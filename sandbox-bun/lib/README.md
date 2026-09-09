# sandbox-bun/lib

A mini component library built with `Bun.build` and the local `@pandacss/bun` plugin. `src/ui/` holds class-name
builders made from `css()` and `cva()` (button, badge, card, stack), re-exported from `src/index.ts`. The build rewrites
the static calls to class strings and emits `dist/index.js` plus the stylesheet. No server, no HTML.

```bash
bun install
bun run build   # dist/index.js + dist/*.css
bun run test    # builds, then checks the bundle and imports it
```
