# Codegen sandbox

## Usage

- `bun cli.ts -h` will show the helper
- `bun cli.ts codegen` will generate every scenarios `outdir`
- `bun cli.ts test` will test every scenarios

## Adding a scenario

- Create a `panda.{scenario}.config.ts` with your specific options
- Add it in the `scenarioList` inside `cli.ts`
- Add it in the `options` inside `vitest.config.ts` with the `test.include` to match specific tests files
- You're done ! You can run `bun cli.ts codegen {scenario}` and `bun cli.ts test {scenario}`

> Pro tip: You can use `-u` or `--update` with `bun cli.ts test` to update every snapshots
