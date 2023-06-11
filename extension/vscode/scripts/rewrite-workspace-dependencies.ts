import { findWorkspaceDir } from '@pnpm/find-workspace-dir'
import { findWorkspacePackages } from '@pnpm/find-workspace-packages'
import type { PackageManifest } from '@pnpm/types'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const _dirname = dirname(fileURLToPath(import.meta.url))

const main = async () => {
  const workspaceRoot = await findWorkspaceDir(_dirname)
  const workspacePkgs = await findWorkspacePackages(workspaceRoot!)

  const pkgJsonPath = path.join(_dirname, '../package.json')
  const pkgDir = path.dirname(pkgJsonPath)

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as PackageManifest

  const rewritePackageVersion =
    (depsMap: Record<string, string>) =>
    ([name, version]: [name: string, version: string]) => {
      const pkg = workspacePkgs.find((pkg) => pkg.manifest.name === name)
      if (pkg && version.includes('workspace:')) {
        depsMap![name] = `file:${path.relative(pkgDir, pkg.dir)}`
        console.log(`Rewrote ${name} to ${depsMap![name]}`)
      }
    }

  Object.entries(pkgJson.dependencies ?? {}).forEach(rewritePackageVersion(pkgJson.dependencies ?? {}))
  Object.entries(pkgJson.devDependencies ?? {}).forEach(rewritePackageVersion(pkgJson.devDependencies ?? {}))

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2))
}
main()
