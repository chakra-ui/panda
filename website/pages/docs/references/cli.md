---
title: CLI Reference
description: You can use the Command-Line Interface (CLI) provided by Panda to develop, build, and preview your project from a terminal window.
---

# CLI Reference

You can use the Command-Line Interface (CLI) provided by Panda to develop, build, and preview your project from a
terminal window.

## `panda init`

Initialize Panda in a project. This process will:

- Create a `panda.config.ts` file in your project with the default settings and presets.
- Emit CSS utilities for your project in the specified `output` directory.

### Flags

#### `--interactive, -i`

Whether to run the interactive mode

#### `--force, -f`

Whether to overwrite existing files

#### `--postcss, -p`

Whether to emit a [postcss](https://postcss.org/) config file

#### `--config, -c <path>`

Path to Panda config file

Related: [`config`](/docs/references/config)

#### `--cwd <dir>`

Path to current working direcory

#### `--silent`

Whether to suppress all output

#### `--no-gitignore`

Whether to update gitignorew with the output directory

#### `--no-codegen`

Whether to run the codegen process

#### `--out-extension <ext>`

The extension of the generated js files (default: 'mjs')

Related: [`config.outExtension`](/docs/references/config#outExtension)

#### `--outdir <dir>`

The output directory for the generated files

Related: [`config.outdir`](/docs/references/config#outdir)

#### `--jsx-framework <framework>`

The jsx framework to use

Related: [`config.jsxFramework`](/docs/references/config#jsxFramework)

#### `--syntax <syntax>`

The css syntax preference

Related: [`config.syntax`](/docs/references/config#syntax)

#### `--strict-tokens`

Set strictTokens to true

Related: [`config.strictTokens`](/docs/references/config#strictTokens)

#### `--logfile <file>`

Outputs logs to a file

Related: [Debugging](/docs/guides/debugging)

---

## `panda`

Run the extract process to generate static CSS from your project.

By default it will scan and generate CSS for the entire project depending on your include and exclude options from your config file.

```bash
pnpm panda
# You can also scan a specific file or folder
# using the optional glob argument
pnpm panda src/components/Button.tsx
pnpm panda "./src/components/**"
```

### Flags

#### `--outdir, -o [dir]`

The output directory for the generated CSS utilities

Related: [`config.outdir`](/docs/references/config#outdir)

#### `--minify, -m`

Whether to minify the generated CSS

Related: [`config.minify`](/docs/references/config#minify)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

#### `--poll`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

#### `--config, -c <path>`

The path to the config file

Related: [`config`](/docs/references/config.md)

#### `--cwd <path>`

The current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--preflight`

Whether to emit the preflight or reset CSS

Related: [`config.preflight`](/docs/references/config#preflight)

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--exclude, -e <files>`

Files to exclude from the extract process

Related: [`config`](/docs/references/config.md)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--hash`

Whether to hash the output classnames

Related: [`config.hash`](/docs/references/config#hash)

#### `--lightningcss`

Use `lightningcss` instead of `postcss` for css optimization.

Related: [`config.lightningcss`](/docs/references/config#lightningcss)

#### `--polyfill`

Polyfill CSS @layers at-rules for older browsers.

Related: [`config.polyfill`](/docs/references/config#polyfill)

#### `--emitTokensOnly`

Whether to only emit the `tokens` directory

Related: [`config.emitTokensOnly`](/docs/references/config#emitTokensOnly)

#### `--cpu-prof`

This will generate a `panda-{command}-{timestamp}.cpuprofile` file in
the current working directory, which can be opened in tools like [Speedscope](https://www.speedscope.app/)

```bash
pnpm panda --cpu-prof
```

Related: [Debugging](/docs/guides/debugging)

#### `--logfile <file>`

Outputs logs to a file

---

## `panda codegen`

Generate new CSS utilities for your project based on the configuration file.

### Flags

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--config, -c <path>`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

#### `--poll, -p`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

#### `--cwd <path>`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--cpu-prof`

This will generate a `panda-{command}-{timestamp}.cpuprofile` file in
the current working directory, which can be opened in tools like [Speedscope](https://www.speedscope.app/)

```bash
pnpm panda --cpu-prof
```

Related: [Debugging](/docs/guides/debugging)

#### `--logfile <file>`

Outputs logs to a file

Related: [Debugging](/docs/guides/debugging)

## `panda cssgen`

Generate the CSS from files.

You can use a `glob` to override the `config.include` option like this:

`panda cssgen "src/**/*.css" --outfile dist.css`

or you can use it with a `{type}` argument to generate only a specific type of CSS:

- preflight
- tokens
- static
- global
- keyframes

> Note that this only works when passing an `--outfile`.

You can use it like this:

```bash
panda cssgen "static" --outfile dist/static.css
```

### Flags

#### `--outfile, -o <file>`

Output file for extracted css, default to './styled-system/styles.css'

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--minify, -m`

Whether to minify the generated CSS

Related: [`config.minify`](/docs/references/config#minify)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--config, -c <path>`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

#### `--minimal`

Skip generating CSS for theme tokens, preflight, keyframes, static and global css.

This means that the generated CSS will only contain the CSS related to the styles found in the included files.

> Note that you can use a `glob` to override the `config.include` option like this:
> `panda cssgen "src/**/*.css" --minimal`

This is useful when you want to split your CSS into multiple files, for example if you want to split by pages.

Use it like this:

```bash
panda cssgen "src/**/pages/*.css" --minimal --outfile dist/pages.css
```

#### `--poll, -p`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

#### `--cwd <path>`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--lightningcss`

Use `lightningcss` instead of `postcss` for css optimization.

Related: [`config.lightningcss`](/docs/references/config#lightningcss)

#### `--polyfill`

Polyfill CSS @layers at-rules for older browsers.

Related: [`config.polyfill`](/docs/references/config#polyfill)

#### `--cpu-prof`

This will generate a `panda-{command}-{timestamp}.cpuprofile` file in
the current working directory, which can be opened in tools like [Speedscope](https://www.speedscope.app/)

```bash
pnpm panda --cpu-prof
```

Related: [Debugging](/docs/guides/debugging)

#### `--logfile <file>`

Outputs logs to a file

Related: [Debugging](/docs/guides/debugging)

## `panda studio`

Realtime documentation for your design tokens.

### Flags

#### `--build`

Build

#### `--preview`

Preview

#### `--port <port>`

Use custom port

#### `--host`

Expose to custom host

#### `--config, -c <path>`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd <path>`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--outdir <dir>`

Output directory for static files

#### `--base <path>`

Base path of project

## `panda analyze`

Analyze design token usage in glob.

By default it will analyze the entire project depending on your include and exclude options from your config file.

```bash
pnpm panda analyze
# You can also analyze a specific file or folder
# using the optional glob argument
pnpm panda analyze src/components/Button.tsx
pnpm panda analyze "./src/components/**"
```

### Flags

#### `--outfile <filepath>`

Output analyze report in given JSON filepath

> `panda analyze --outfile report.json`

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--config, -c <path>`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd <path>`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

## `panda debug`

Debug design token extraction & CSS generated from files in glob.

More details in [Debugging](/docs/guides/debugging) docs.

### Flags

#### `--silent`

Whether to suppress all output

#### `--dry`

Output debug files in stdout without writing to disk

#### `--outdir <dir>`

Output directory for debug files, defaults to `../styled-system/debug`

#### `--only-config`

Should only output the config file, default to 'false'

#### `--config, -c <path>`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd <path>`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--cpu-prof`

This will generate a `panda-{command}-{timestamp}.cpuprofile` file in
the current working directory, which can be opened in tools like [Speedscope](https://www.speedscope.app/)

```bash
pnpm panda --cpu-prof
```

Related: [Debugging](/docs/guides/debugging#performance-profiling)

#### `--logfile <file>`

Outputs logs to a file

Related: [Debugging](/docs/guides/debugging)

## `panda ship`

Ship extract result from files in glob.

By default it will extract from the entire project depending on your include and exclude options from your config file.

```bash
pnpm panda ship
# You can also analyze a specific file or folder
# using the optional glob argument
pnpm panda ship src/components/Button.tsx
pnpm panda ship "./src/components/**"
```

### Flags

#### `--outfile <filepath>`

Output path for the JSON build info file, default to './styled-system/panda.buildinfo.json'

> `panda ship --outfile report.json`

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--minify, -m`

Whether to minify the generated JSON

#### `--config, -c <path>`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd <path>`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

#### `--poll`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

## `panda emit-pkg`

Emit package.json with entrypoints, can be used to create a workspace package dedicated to the [`config.outdir`](/docs/references/config#outdir), in combination with [`config.importMap`](/docs/references/config#importmap)

### Flags

#### `--outdir [dir]`

The output directory for the generated CSS utilities

Related: [`config.outdir`](/docs/references/config#outdir)

#### `--base [path]`

The base directory of the package.json entrypoints

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--cwd`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)
