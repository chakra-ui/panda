#!/usr/bin/env node
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const args = process.argv[2] === '--' ? process.argv.slice(3) : process.argv.slice(2)
const { values } = parseArgs({
  args,
  allowPositionals: true,
  options: {
    'compiler-tgz': { type: 'string' },
    'compiler-shared-tgz': { type: 'string' },
    'config-tgz': { type: 'string' },
    'types-tgz': { type: 'string' },
    'wasi-tgz': { type: 'string' },
    port: { type: 'string', default: '0' },
  },
})

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const localTarballs = {
  compiler: optionalFile(values['compiler-tgz'], '--compiler-tgz'),
  compilerShared: optionalFile(values['compiler-shared-tgz'], '--compiler-shared-tgz'),
  config: optionalFile(values['config-tgz'], '--config-tgz'),
  types: optionalFile(values['types-tgz'], '--types-tgz'),
  wasi: optionalFile(values['wasi-tgz'], '--wasi-tgz'),
}

if (Boolean(localTarballs.compiler) !== Boolean(localTarballs.wasi)) {
  throw new Error('Pass both --compiler-tgz and --wasi-tgz, or neither')
}

const server = createServer((request, response) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')

  const tarball = Object.values(getTarballRoutes(localTarballs)).find((route) => route.url === request.url)
  if (tarball) {
    response.setHeader('Content-Type', 'application/gzip')
    response.end(readFileSync(tarball.path))
    return
  }

  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(renderPage({ localTarballs, version: packageJson.version }))
})

server.listen(Number(values.port), '127.0.0.1', () => {
  const address = server.address()
  if (!address || typeof address === 'string') return
  console.log(`Open http://127.0.0.1:${address.port} in a Chromium browser to run the WebContainer API check.`)
  if (localTarballs.compiler) {
    console.log(
      `Using local tarballs: ${Object.values(localTarballs)
        .filter(Boolean)
        .map((path) => basename(path))
        .join(', ')}`,
    )
  } else {
    console.log(`Using published @pandacss/compiler@${packageJson.version}`)
  }
})

function optionalFile(path, flag) {
  if (!path) return undefined
  const absolute = resolve(path)
  if (!existsSync(absolute)) throw new Error(`${flag} does not exist: ${absolute}`)
  return absolute
}

function getTarballRoutes(localTarballs) {
  return {
    compiler: { path: localTarballs.compiler, url: '/compiler.tgz' },
    compilerShared: { path: localTarballs.compilerShared, url: '/compiler-shared.tgz' },
    config: { path: localTarballs.config, url: '/config.tgz' },
    types: { path: localTarballs.types, url: '/types.tgz' },
    wasi: { path: localTarballs.wasi, url: '/compiler-wasm32-wasi.tgz' },
  }
}

function renderPage({ localTarballs, version }) {
  const routes = Object.fromEntries(Object.entries(getTarballRoutes(localTarballs)).filter(([, route]) => route.path))
  const dependencies = localTarballs.compiler
    ? {
        '@pandacss/compiler': 'file:./compiler.tgz',
        '@pandacss/compiler-wasm32-wasi': 'file:./compiler-wasm32-wasi.tgz',
        ...(localTarballs.compilerShared ? { '@pandacss/compiler-shared': 'file:./compiler-shared.tgz' } : {}),
        ...(localTarballs.config ? { '@pandacss/config': 'file:./config.tgz' } : {}),
        ...(localTarballs.types ? { '@pandacss/types': 'file:./types.tgz' } : {}),
      }
    : {
        '@pandacss/compiler': version,
      }
  const pnpm = localTarballs.compiler
    ? {
        overrides: {
          '@pandacss/compiler': 'file:./compiler.tgz',
          '@pandacss/compiler-wasm32-wasi': 'file:./compiler-wasm32-wasi.tgz',
          ...(localTarballs.compilerShared ? { '@pandacss/compiler-shared': 'file:./compiler-shared.tgz' } : {}),
          ...(localTarballs.config ? { '@pandacss/config': 'file:./config.tgz' } : {}),
          ...(localTarballs.types ? { '@pandacss/types': 'file:./types.tgz' } : {}),
        },
      }
    : undefined

  return `<!doctype html>
<meta charset="utf-8">
<title>Panda WebContainer Verification</title>
<pre id="log">Booting WebContainer...</pre>
<script type="module">
import { WebContainer } from 'https://esm.sh/@webcontainer/api@1.6.4'

const logEl = document.getElementById('log')
const log = (line) => {
  logEl.textContent += '\\n' + line
}

const dependencies = ${JSON.stringify(dependencies, null, 2)}
const files = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        type: 'module',
        scripts: { test: 'node test.mjs' },
        dependencies,
        pnpm: ${JSON.stringify(pnpm)},
      }, null, 2),
    },
  },
  'test.mjs': {
    file: {
      contents: \`import { compile, getBindingInfo } from '@pandacss/compiler'

const info = getBindingInfo()
console.log('binding info:', JSON.stringify(info))
if (!info.native) throw new Error('Expected native-compatible WASI binding')

const output = compile()
if (!output || typeof output.css !== 'string') {
  throw new Error('Expected compile() to return CSS output')
}
console.log('compile ok')\`,
    },
  },
}

for (const [name, route] of Object.entries(${JSON.stringify(routes, null, 2)})) {
  files[route.url.slice(1)] = {
    file: { contents: new Uint8Array(await (await fetch(route.url)).arrayBuffer()) },
  }
}

const webcontainer = await WebContainer.boot({ coep: 'require-corp' })
await webcontainer.mount(files)
log('Mounted test project')

await run(webcontainer, 'pnpm', ['i'])
await run(webcontainer, 'pnpm', ['test'])
log('PASS: @pandacss/compiler loaded through WebContainer')

async function run(webcontainer, command, args) {
  log('$ ' + [command, ...args].join(' '))
  const process = await webcontainer.spawn(command, args)
  process.output.pipeTo(new WritableStream({
    write(data) {
      log(data.trimEnd())
    },
  }))
  const exitCode = await process.exit
  if (exitCode !== 0) throw new Error(command + ' failed with exit code ' + exitCode)
}
</script>`
}
