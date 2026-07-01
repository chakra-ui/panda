import {
  createOnMessage as __wasmCreateOnMessageForFsProxy,
  getDefaultContext as __emnapiGetDefaultContext,
  instantiateNapiModuleSync as __emnapiInstantiateNapiModuleSync,
  WASI as __WASI,
} from '@napi-rs/wasm-runtime'



const __wasi = new __WASI({
  version: 'preview1',
})

const __wasmUrl = new URL('./compiler.wasm32-wasi.wasm', import.meta.url).href
const __emnapiContext = __emnapiGetDefaultContext()


const __sharedMemory = new WebAssembly.Memory({
  initial: 4000,
  maximum: 65536,
  shared: true,
})

const __wasmFile = await fetch(__wasmUrl).then((res) => res.arrayBuffer())

const {
  instance: __napiInstance,
  module: __wasiModule,
  napiModule: __napiModule,
} = __emnapiInstantiateNapiModuleSync(__wasmFile, {
  context: __emnapiContext,
  asyncWorkPoolSize: 4,
  wasi: __wasi,
  onCreateWorker() {
    const worker = new Worker(new URL('@pandacss/compiler-wasm32-wasi/wasi-worker-browser.mjs', import.meta.url), {
      type: 'module',
    })


    return worker
  },
  overwriteImports(importObject) {
    importObject.env = {
      ...importObject.env,
      ...importObject.napi,
      ...importObject.emnapi,
      memory: __sharedMemory,
    }
    return importObject
  },
  beforeInit({ instance }) {
    for (const name of Object.keys(instance.exports)) {
      if (name.startsWith('__napi_register__')) {
        instance.exports[name]()
      }
    }
  },
})
export default __napiModule.exports
export const Compiler = __napiModule.exports.Compiler
export const Extractor = __napiModule.exports.Extractor
export const compile = __napiModule.exports.compile
export const DiagnosticSeverity = __napiModule.exports.DiagnosticSeverity
export const extract = __napiModule.exports.extract
export const extractCalls = __napiModule.exports.extractCalls
export const extractDebug = __napiModule.exports.extractDebug
export const ExtractedArgKind = __napiModule.exports.ExtractedArgKind
export const extractJsx = __napiModule.exports.extractJsx
export const flushTracing = __napiModule.exports.flushTracing
export const ImportKind = __napiModule.exports.ImportKind
export const ImportSpecifierKind = __napiModule.exports.ImportSpecifierKind
export const JsxKind = __napiModule.exports.JsxKind
export const MatchCategory = __napiModule.exports.MatchCategory
export const matchImports = __napiModule.exports.matchImports
export const scanImports = __napiModule.exports.scanImports
export const shutdownTracing = __napiModule.exports.shutdownTracing
export const startTracing = __napiModule.exports.startTracing
