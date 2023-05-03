import { bundleNRequire } from 'bundle-n-require'

export async function bundle(filePath: string, cwd: string) {
  const { mod: config, dependencies } = await bundleNRequire(filePath, { cwd })
  return { config, dependencies }
}
