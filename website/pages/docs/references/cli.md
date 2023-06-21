---
title: CLI Reference
description: You can use the Command-Line Interface (CLI) provided by Astro to develop, build, and preview your project from a terminal window.
---

# CLI Reference

You can use the Command-Line Interface (CLI) provided by Astro to develop, build, and preview your project from a
terminal window.

## `panda init`

Initialize panda in a project. This process will:

- Create a `panda.config.ts` file in your project with the default settings and presets.
- Emit css utilities for your project in the specified `output` directory.

### Flags

#### `--postcss, -p`

Whether to emit a [postcss](https://postcss.org/) config file

#### `--force, -f`

Whether to overwrite existing files

#### `--silent`

Whether to suppress all output

---

## `panda`

Run the extract process to generate static css from your project.

### Flags

#### `--outdir`

The output directory for the generated css utilities

Related: [`config.outdir`](/docs/references/config.mdx#outdir)

#### `--minify`

Whether to minify the generated css

Related: [`config.minify`](/docs/references/config.mdx#minify)

#### `--cwd`

The current working directory

Related: [`config.cwd`](/docs/references/config.mdx#cwd)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config.mdx#watch)

#### `--poll`

Whether to poll for file changes.

Related: [`config.poll`](/docs/references/config.mdx#poll)

#### `--config`

The path to the config file

Related: [`config`](/docs/references/config.mdx)

#### `--preflight`

Whether to emit the preflight or reset css

Related: [`config.preflight`](/docs/references/config.mdx#preflight)

#### `--emitTokensOnly`

Whether to only emit the `tokens` directory

Related: [`config.emitTokensOnly`](/docs/references/config.mdx#emitTokensOnly)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config.mdx#clean)

#### `--hash`

Whether to hash the output classnames

Related: [`config.hash`](/docs/references/config.mdx#hash)

---

## `panda codegen`

Generate a new css utilities for your project based on the configuraion file.

### Flags

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config.mdx#clean)

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config.mdx#log-level)

## `panda analyze`

Analyze design token usage in glob

### Flags

#### `--json [filepath]`

Output analyze report in given JSON filepath.

> `panda analyze --json report.json`

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config.mdx#log-level)

## `panda debug`

Debug design token extraction & css generated from files in glob

### Flags

#### `--dry`

Output debug files in stdout without writing to disk

#### `--outdir [dir]`

Output directory for debug files, default to '../styled-system/debug'

#### `--silent`

Whether to suppress all output
