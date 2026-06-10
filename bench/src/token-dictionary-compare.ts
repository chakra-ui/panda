import { performance } from 'node:perf_hooks'
import { TokenDictionary } from '@pandacss/token-dictionary'

interface Args {
  tokens: number
  warm: number
  lookup: number
  mode: 'full' | 'register'
}

const args = parseArgs()
const config = generatedConfig(args.tokens)

for (let i = 0; i < args.warm; i++) {
  buildDictionary(config, args.mode)
}

const buildStart = performance.now()
const dictionary = buildDictionary(config, args.mode)
const buildMs = performance.now() - buildStart

let checksum = 0
const lookupStart = performance.now()
for (let i = 0; i < args.lookup; i++) {
  const path = `colors.palette${i % args.tokens}.500`
  const value = dictionary.view?.get(path) ?? dictionary.getByName(path)?.value
  if (value) checksum += String(value).length
}
const lookupMs = performance.now() - lookupStart

const varLookupStart = performance.now()
for (let i = 0; i < args.lookup; i++) {
  const path = `colors.palette${i % args.tokens}.500`
  const value = dictionary.view?.getVar(path)
  if (value) checksum += String(value).length
}
const varLookupMs = performance.now() - varLookupStart

const categoryStart = performance.now()
const categoryValues = dictionary.view?.getCategoryValues('colors') ?? {}
checksum += Object.keys(categoryValues).length
const categoryValuesMs = performance.now() - categoryStart

console.log(
  JSON.stringify({
    engine: `js-${args.mode}`,
    inputTokens: args.tokens,
    dictionaryTokens: dictionary.allTokens.length,
    buildMs,
    lookupIterations: args.lookup,
    lookupMs,
    varLookupMs,
    categoryValuesMs,
    checksum,
  }),
)

function buildDictionary(config: any, mode: Args['mode']) {
  const dictionary = new TokenDictionary(config)
  if (mode === 'register') {
    dictionary.registerTokens()
    dictionary.setComputedView()
    return dictionary
  }
  return dictionary.init()
}

function parseArgs(): Args {
  const args: Args = {
    tokens: 1000,
    warm: 5,
    lookup: 100_000,
    mode: 'full',
  }
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--tokens') args.tokens = Number(argv[++i]) || args.tokens
    else if (arg === '--warm') args.warm = Number(argv[++i]) || args.warm
    else if (arg === '--lookup') args.lookup = Number(argv[++i]) || args.lookup
    else if (arg === '--mode') args.mode = argv[++i] === 'register' ? 'register' : 'full'
  }
  return args
}

function generatedConfig(tokens: number) {
  return {
    tokens: {
      colors: generatedColors(tokens),
      spacing: generatedSpacing(Math.floor(tokens / 4)),
    },
    semanticTokens: {
      colors: generatedSemanticColors(Math.floor(tokens / 4)),
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
    },
  }
}

function generatedColors(count: number) {
  const colors: Record<string, unknown> = {}
  for (let i = 0; i < count; i++) {
    colors[`palette${i}`] = {
      500: {
        value: `#${(i % 0xffffff).toString(16).padStart(6, '0')}`,
      },
    }
  }
  return colors
}

function generatedSpacing(count: number) {
  const spacing: Record<string, unknown> = {}
  for (let i = 0; i < count; i++) {
    spacing[i] = { value: `${i + 1}rem` }
  }
  return spacing
}

function generatedSemanticColors(count: number) {
  const colors: Record<string, unknown> = {}
  for (let i = 0; i < count; i++) {
    colors[`fg${i}`] = {
      value: {
        base: `{colors.palette${i}.500}`,
        _dark: `#${((i + 17) % 0xffffff).toString(16).padStart(6, '0')}`,
      },
    }
  }
  return colors
}
