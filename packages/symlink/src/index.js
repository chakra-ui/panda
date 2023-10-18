const fs = require('fs')

function symlink({ workspacePackagesDir, requireSource }) {
  console.log('Panda in dev mode, running from source')
  const module = require('module')
  const path = require('path')

  const addHook = require('pirates').addHook
  const resolveExports = require('resolve.exports')
  const sucrase = require('sucrase')

  /**
   * Patch the Node CJS loader to suppress the ESM error
   * https://github.com/nodejs/node/blob/069b5df/lib/internal/modules/cjs/loader.js#L1125
   *
   * As per https://github.com/standard-things/esm/issues/868#issuecomment-594480715
   * @see https://github.com/egoist/esbuild-register/blob/311a1ef067f0078faa870dcb6db6f29fa4ea61d1/src/node.ts
   */
  function patchCommonJsLoader(compile) {
    // @ts-expect-error
    const extensions = module.Module._extensions
    const jsHandler = extensions['.js']

    extensions['.js'] = function (module, filename) {
      try {
        return jsHandler.call(this, module, filename)
      } catch (error) {
        if (error.code !== 'ERR_REQUIRE_ESM') {
          throw error
        }

        let content = fs.readFileSync(filename, 'utf8')
        content = compile(content, filename, 'cjs')
        module._compile(content, filename)
      }
    }

    return () => {
      extensions['.js'] = jsHandler
    }
  }

  const conditions = ['source', 'import', 'module', 'require', 'node', 'default']

  const transformTs = (code) => sucrase.transform(code, { transforms: ['typescript', 'imports'] }).code
  const transformEsm = (code) => sucrase.transform(code, { transforms: ['imports'] }).code

  const compile = (code, filename) => {
    // if not in the workspace, only transform ESM to CJS
    if (!filename.startsWith(workspacePackagesDir)) {
      return transformEsm(code)
    }

    // otherwise, transform all imports to absolute paths
    // resolved from each package.json exports conditions
    const transformed = transformTs(code)
    const replaced = transformed.replace(/require\(['"]@pandacss\/(.*?)['"]\)/g, (_match, pkg) => {
      const [pkgName, importPath] = pkg.split('/')
      const subpath = importPath ? './' + importPath : '.'
      const pkgJson = require(path.join(workspacePackagesDir, pkgName, 'package.json'))

      const resolved = resolveExports.exports(pkgJson, subpath, { conditions })

      // from `./src/index.ts` to `./src/index`
      const relativeResolved = resolved && resolved[0]?.slice(1, -3)

      // if not resolved (@pandacss/studio), return empty object
      if (!relativeResolved) {
        return `{}`
      }

      // from `require("@pandacss/core")` to `require("@pandacss/core/src/index")`
      // from `require("@pandacss/config/ts-path")` to `require("@pandacss/config/src/resolve-ts-path-pattern")`
      return `require('${path.join(workspacePackagesDir, pkgName, relativeResolved).replace('\\', '/')}')`
    })

    return replaced
  }

  const revert = addHook(compile, { exts: ['.js', '.ts'] })
  const unpatch = patchCommonJsLoader(compile)

  requireSource()

  return () => {
    revert()
    unpatch()
  }
}

module.exports = symlink
