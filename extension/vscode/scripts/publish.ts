import childProcess from 'child_process'
import * as semver from 'semver'
import { config } from 'dotenv'

const execaSync = childProcess.execSync

config()

const { version } = require('../package.json')

const releaseType = process.env.VSCE_RELEASE_TYPE
const target = process.env.VSCE_TARGET

const tokens = {
  vscode: releaseType === 'dry-run' ? 'dry-run' : process.env.VSCE_TOKEN,
  openvsx: releaseType === 'dry-run' ? 'dry-run' : process.env.OVSX_TOKEN,
}

const hasTokens = tokens.vscode !== undefined
if (!hasTokens) {
  throw new Error('Cannot publish extension without tokens.')
}

const today = process.env.VSCE_RELEASE_VERSION ?? new Date().getTime().toString().slice(0, 8)
const currentVersion = semver.valid(version)

if (!currentVersion) {
  throw new Error('Cannot get the current version number from package.json')
}

const rcVersion = semver.inc(currentVersion, 'minor')?.replace(/\.\d+$/, `.${today}`)
if (!rcVersion) {
  throw new Error("Could not populate the current version number for rc's build.")
}

const commands = {
  vscode_package: `pnpm vsix-builder package ${rcVersion} --target ${target} -o panda.vsix`,
  vscode_publish: `pnpm vsce publish --packagePath panda.vsix --pat ${process.env.VSCE_TOKEN}`,
  // rc release: publish to VS Code Marketplace with today's date as patch number
  vscode_package_rc: `pnpm vsix-builder package ${rcVersion} --pre-release --target ${target} -o panda.vsix`,
  vscode_rc: `pnpm vsce publish --pre-release --packagePath panda.vsix --pat ${process.env.VSCE_TOKEN}`,
  // To publish to the open-vsx registry
  openvsx_publish: `npx ovsx publish panda.vsix --pat ${process.env.OVSX_TOKEN}`,
}

console.log('[vsce:package]', commands.vscode_package_rc, target)
switch (releaseType) {
  case 'rc':
    execaSync(commands.vscode_package_rc, { stdio: 'inherit' })
    break
  case 'stable':
    execaSync(commands.vscode_package, { stdio: 'inherit' })
    break
  default:
    console.log('[vsce:package]', "Skipping 'vsce package' step.")
}

console.log('[vsce:publish] publishing', rcVersion, target)
switch (releaseType) {
  case 'rc':
    if (!rcVersion || !semver.valid(rcVersion) || semver.valid(rcVersion) === currentVersion) {
      throw new Error('Cannot publish rc build with an invalid version number: ' + rcVersion)
    }
    execaSync(commands.vscode_rc, { stdio: 'inherit' })
    break

  case 'stable':
    execaSync(commands.vscode_rc, { stdio: 'inherit' })
    execaSync(commands.openvsx_publish, { stdio: 'inherit' })
    break

  case 'dry-run':
    console.info('[vsce:publish]', `Current version: ${currentVersion}.`)
    console.info('[vsce:publish]', `Pre-release version for rc's build: ${rcVersion}.`)
    break

  default:
    throw new Error(`Invalid release type: ${releaseType}`)
}
