import { promisify } from 'util'
import * as cp from 'child_process'
import * as semver from 'semver'
import type { Manifest } from './manifest'

export interface IVersionBumpOptions {
  readonly cwd?: string
  readonly version?: string
  readonly commitMessage?: string
  readonly gitTagVersion?: boolean
  readonly updatePackageJson?: boolean
}

/**
 * @see https://github.com/microsoft/vscode-vsce/blob/7d1cc98c297f764fe15f2a189392c22c7242fabb/src/package.ts#L350
 */
export async function versionBump(manifest: Manifest, options: IVersionBumpOptions): Promise<void> {
  if (!options.version) {
    return
  }

  if (!(options.updatePackageJson ?? true)) {
    return
  }

  if (manifest.version === options.version) {
    return
  }

  // update the manifest object
  const manifestVersion = manifest.version
  const today = new Date().getTime().toString().slice(0, 8)
  const currentVersion = semver.valid(manifestVersion)

  if (!currentVersion) {
    throw new Error('Cannot get the current version number from package.json')
  }

  const rcVersion = semver.inc(currentVersion, 'minor')?.replace(/\.\d+$/, `.${today}`)
  if (!rcVersion) {
    throw new Error("Could not populate the current version number for rc's build.")
  }

  if (rcVersion) {
    manifest.version = rcVersion
    console.log(`Bumped version from ${manifestVersion} to ${rcVersion}`)
  }

  let command = `npm version ${rcVersion}`

  if (options.commitMessage) {
    command = `${command} -m "${options.commitMessage}"`
  }

  if (!(options.gitTagVersion ?? true)) {
    command = `${command} --no-git-tag-version`
  }

  // call `npm version` to do our dirty work
  const cwd = options.cwd ?? process.cwd()
  const { stdout, stderr } = await promisify(cp.exec)(command, { cwd })

  if (!process.env['VSCE_TESTS']) {
    process.stdout.write(stdout)
    process.stderr.write(stderr)
  }
}
