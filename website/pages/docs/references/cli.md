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

#### `--postcss, -p`

Whether to emit a [postcss](https://postcss.org/) config file

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config)

#### `--force, -f`

Whether to overwrite existing files

#### `--silent`

Whether to suppress all output

---

## `panda`

Run the extract process to generate static CSS from your project.

### Flags

#### `--outdir`

The output directory for the generated CSS utilities

Related: [`config.outdir`](/docs/references/config#outdir)

#### `--minify`

Whether to minify the generated CSS

Related: [`config.minify`](/docs/references/config#minify)

#### `--cwd`

The current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

#### `--poll`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

#### `--config`

The path to the config file

Related: [`config`](/docs/references/config.md)

#### `--preflight`

Whether to emit the preflight or reset CSS

Related: [`config.preflight`](/docs/references/config#preflight)

#### `--emitTokensOnly`

Whether to only emit the `tokens` directory

Related: [`config.emitTokensOnly`](/docs/references/config#emitTokensOnly)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--hash`

Whether to hash the output classnames

Related: [`config.hash`](/docs/references/config#hash)

---

## `panda codegen`

Generate new CSS utilities for your project based on the configuration file.

### Flags

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd, -c`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

## `panda cssgen`

Generate the CSS from files.

### Flags

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd, -c`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

## `panda studio`

Realtime documentation for your design tokens.

### Flags

#### `--build`

Build

#### `--preview`

Preview

#### `--outdir`

Output directory for static files

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd, -c`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

## `panda analyze`

Analyze design token usage in glob.

### Flags

#### `--json [filepath]`

Output analyze report in given JSON filepath

> `panda analyze --json report.json`

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd, -c`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

## `panda debug`

Debug design token extraction & CSS generated from files in glob.

### Flags

#### `--dry`

Output debug files in stdout without writing to disk

#### `--outdir [dir]`

Output directory for debug files, defaults to `../styled-system/debug`

#### `--silent`

Whether to suppress all output

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd, -c`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)
