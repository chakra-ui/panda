---
'@pandacss/node': patch
'@pandacss/dev': patch
---

Add a `--cpu-prof` flag to `panda`, `panda cssgen`, `panda codegen` and `panda debug` commands This is useful for
debugging performance issues in `panda` itself. This will generate a `panda-{command}-{timestamp}.cpuprofile` file in
the current working directory, which can be opened in tools like [Speedscope](https://www.speedscope.app/)

This is mostly intended for maintainers or can be asked by maintainers to help debug issues.
