// True for `--help`/`-h` or a leading non-dash token (subcommand or typo). Everything else — no args
// or leading flags (`panda --watch`) — is the default build, run standalone so citty doesn't read a
// flag value like `panda --outdir foo` as a subcommand.
export function useDispatcher(rawArgs: string[]): boolean {
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) return true

  const first = rawArgs[0]
  return first !== undefined && !first.startsWith('-')
}
