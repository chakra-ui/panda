import outdent from 'outdent'
import path from 'path'
import esbuild from 'esbuild'

export function compileCssFunction(transform: string) {
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
    import { transform } from '${transform}'
    
    const context = { transform }
    
    ${text}
  `
}

export function compileConfig(filePath: string) {
  const { outputFiles } = esbuild.buildSync({
    write: false,
    metafile: true,
    entryPoints: [filePath],
    bundle: true,
    format: 'esm',
  })
  const [{ text }] = outputFiles

  return outdent`
    // This is a generated file. Do not edit.
    ${text}
  `
}

export function generateTransform(configPath: string) {
  return outdent`
    import config from '${configPath}'

    var transform = (prop, value) => {
      for (const utility of config.utilities) {
        for (const key in utility.properties) {
          if (prop === key) {
            const { className } = utility.properties[key]
            return { className: typeof className === 'string' ? \`\${className}:\${value}\` : className }
          }
        }
      }
    
      return { className: \`\${prop}:\${value}\` }
    }

    export {
      transform 
    }
    `
}

export function generateCx() {
  return {
    js: outdent`
    var cx = (...args) => {
      return Array.isArray(args[0]) ? clsx(...args[0]) : clsx(...args);
    }

    export { cx }
`,
    dts: outdent`
     export declare function cx(...args: Values | Values[]): string;
    `,
  }
}
