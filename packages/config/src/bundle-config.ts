import { build } from 'esbuild'

export async function bundleConfigFile(
  fileName: string,
  isESM = false,
): Promise<{ code: string; dependencies: string[] }> {
  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    outfile: 'out.js',
    write: false,
    platform: 'node',
    target: ['es2020', 'node14'],
    bundle: true,
    format: isESM ? 'esm' : 'cjs',
    sourcemap: false,
    metafile: true,
    mainFields: ['module', 'main'],
  })

  const { text } = result.outputFiles[0]

  return {
    code: text,
    dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
  }
}
