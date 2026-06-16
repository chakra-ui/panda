---
'@pandacss/cli': minor
---

Add the `panda debug` command — dumps the resolved config and per-file extraction for bug reports.

- writes `info.json` (platform, node, config path), `config.json`, `<file>.extract.json` per source, and the project
  `styles.css` under `<outdir>/debug`.
- flags: `--outdir`, `--dry` (print to stdout), `--only-config`.
- v2 emits atomic CSS at the project level, so the dump carries one project stylesheet rather than a per-file slice.
