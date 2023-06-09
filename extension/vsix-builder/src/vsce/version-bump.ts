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

  const cwd = options.cwd ?? process.cwd()

  if (manifest.version === options.version) {
    return
  }

  switch (options.version) {
    case 'major':
    case 'minor':
    case 'patch':
      break
    case 'premajor':
    case 'preminor':
    case 'prepatch':
    case 'prerelease':
    case 'from-git':
      return Promise.reject(`Not supported: ${options.version}`)
    default:
      if (!semver.valid(options.version)) {
        return Promise.reject(`Invalid version ${options.version}`)
      }
  }

  let command = `npm version ${options.version}`

  if (options.commitMessage) {
    command = `${command} -m "${options.commitMessage}"`
  }

  if (!(options.gitTagVersion ?? true)) {
    command = `${command} --no-git-tag-version`
  }

  // call `npm version` to do our dirty work
  const { stdout, stderr } = await promisify(cp.exec)(command, { cwd })

  if (!process.env['VSCE_TESTS']) {
    process.stdout.write(stdout)
    process.stderr.write(stderr)
  }
}
