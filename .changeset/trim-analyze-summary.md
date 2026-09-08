---
'@pandacss/cli': minor
---

Remove the `--report` and `--ui` flags from `panda analyze`, along with the bundled HTML report and its live server. The
command keeps the usage summary, the token and recipe tables, `--scope`, `--limit`, `--json`, and `--outfile`, so
scripts and CI keep the same JSON report.
