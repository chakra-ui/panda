const FORMATTABLE = /\.(m?[jt]sx?|cjs|cts)$/

export async function formatSource(path: string, source: string): Promise<string | null> {
  if (!FORMATTABLE.test(path)) return null
  try {
    const [prettier, typescript, estree] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/typescript'),
      import('prettier/plugins/estree').then((m) => m.default),
    ])
    return await prettier.format(source, {
      parser: 'typescript',
      plugins: [typescript, estree],
      printWidth: 80,
      singleQuote: true,
      semi: false,
    })
  } catch {
    return null
  }
}
