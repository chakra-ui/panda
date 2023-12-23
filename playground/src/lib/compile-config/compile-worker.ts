import { evalConfig } from './eval-config'
import { extractImports } from './extract-imports'

const importShim = (0, eval)('u=>import(u)')

const require = async (module: string) => {
  if (typeof module !== 'string') {
    throw new Error('The "id" argument must be of type string. Received ' + typeof module)
  }
  if (module === '') {
    throw new Error("The argument 'id' must be a non-empty string. Received ''")
  }
  const href = 'https://cdn.skypack.dev/' + module + '?min'
  let res
  try {
    res = await importShim(href)
  } catch (error) {
    throw new Error("Cannot find module '" + module + "'")
  }
  return res
}

addEventListener('message', async (event: MessageEvent<string>) => {
  const config = event.data
  const imports = extractImports(config)

  const modules = await Promise.all(
    imports.map(async (_mod) => {
      const mod = await require(_mod.pkg)
      return Object.entries(_mod.exps).map(([key, val]) => {
        if (key === 'default') return { [val]: mod.default ?? mod }
        if (val === '*') return { [key]: mod }
        return { [val ?? key]: mod[key] }
      })
    }),
  )

  const scope = modules.flat().reduce((acc, cur) => Object.assign({}, acc, cur), {})

  const newUserConfig = evalConfig(config, scope)
  postMessage(JSON.stringify(newUserConfig))
})
