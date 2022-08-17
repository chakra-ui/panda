import { Dictionary } from '@css-panda/dictionary'
import outdent from 'outdent'
import path from 'path'
import esbuild from 'esbuild'

export function generateJs(dict: Dictionary) {
  const map = new Map<string, { value: string; variable: string }>()

  for (const [key, entry] of dict.values.entries()) {
    map.set(key, { value: entry.value, variable: entry.varRef })
  }

  const obj = Object.fromEntries(map)

  return outdent`
  const tokens = ${JSON.stringify(obj, null, 2)}
  
  function getToken(path) {
    const { value } = tokens[path] || {}
    return value
  }
  
  function getTokenVar(path) {
    const { variable } = tokens[path] || {}
    return variable
  }
  `
}

export function bundleCss() {
  const filePath = require.resolve('@css-panda/atomic')
  const cssPath = path.join(path.dirname(filePath), 'src', 'atomic-classname.ts')
  const { outputFiles } = esbuild.buildSync({
    write: false,
    metafile: true,
    entryPoints: [cssPath],
    bundle: true,
    format: 'esm',
  })
  const [{ text }] = outputFiles

  return outdent`
  // panda.config
    const context = {
      transform(prop, value){
        return \`\$\{prop}:\$\{value}\`
      }
    }

    ${text}
  `
}
