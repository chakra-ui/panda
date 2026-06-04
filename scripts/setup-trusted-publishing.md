# Trusted publishing (npm OIDC)

Releases authenticate to npm with a short-lived OIDC credential instead of an
`NPM_TOKEN`, so there is nothing to rotate or leak. Companion script:
`setup-trusted-publishing.mjs`.

`pnpm release` runs `changeset publish`, which shells out to `pnpm publish`, which
does the OIDC handshake (pnpm 10.16+). The release job grants `id-token: write`
and passes no token. Each package must have a trusted publisher configured on npm
first, pointing at `chakra-ui/panda` + `release.yml`.

## Gotcha

`npm trust` can't use a token (npm rejects automation / bypass-2FA tokens by
design), so configuring trust needs an interactive login. A new package must exist
on npm before it can be trusted, so onboarding does one first publish. That publish
uses your `npm login` session by default (may prompt for an OTP); set `NPM_TOKEN`
only if you want it non-interactive.

## Examples

Configure trust for packages already on npm:

```bash
npm login --auth-type=web
node scripts/setup-trusted-publishing.mjs
```

Onboard new packages (e.g. from the v2 branch): build, publish each missing one,
then trust it. The login session handles the publish:

```bash
npm login --auth-type=web
node scripts/setup-trusted-publishing.mjs --first-publish
```

Same thing non-interactively (no OTP prompt on publish) by adding a token:

```bash
NPM_TOKEN=<token> node scripts/setup-trusted-publishing.mjs --first-publish
```

Preview without changing anything:

```bash
node scripts/setup-trusted-publishing.mjs --dry-run
```

Target a different repo or workflow file:

```bash
node scripts/setup-trusted-publishing.mjs --repo my-org/my-repo --file publish.yml
```

Flags: `--repo <owner/repo>` (default: git origin), `--file <workflow>` (default:
`release.yml`), `--first-publish`, `--dry-run`, `--yes` (skip the pre-publish
pause). Needs npm 11.10+ for `npm trust`; falls back to `npx npm@latest`. Idempotent.

## Release fails with E404?

That's an auth failure in disguise. Check, in order:

1. Is a trusted publisher configured for the failing package? New packages need
   the `--first-publish` step above.
2. Does the workflow still have `id-token: write` and no stray `NODE_AUTH_TOKEN`?
3. Did `setup-node` reintroduce `registry-url`? It writes an empty-token `.npmrc`
   that makes pnpm skip the OIDC exchange.
