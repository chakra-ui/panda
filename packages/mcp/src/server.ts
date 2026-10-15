import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { analyzeSources, createNodeDriver, type Driver } from '@pandacss/compiler'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import * as z from 'zod/v4'
import pkg from '../package.json'

const json = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data) }],
})

export interface CreateMcpServerOptions {
  driver: Driver
}

/**
 * Create an MCP server with all tools registered.
 * This is separated from `startMcpServer` to allow testing with custom transports.
 */
export function createMcpServer(options: CreateMcpServerOptions) {
  const { driver } = options
  const syncConfig = createConfigSync(driver)

  const server = new McpServer({
    name: '@pandacss/mcp',
    version: pkg.version,
  })

  const theme = () => (driver.config.theme ?? {}) as Record<string, unknown>

  // Names stay plain strings: the config can change while the server runs, and an enum would be stale.
  const nameSchema = (description: string) => z.string().optional().describe(description)

  const unknownName = (kind: string, name: string, known: string[]) => ({
    content: [{ type: 'text' as const, text: `Unknown ${kind} "${name}". Available: ${known.join(', ') || 'none'}` }],
    isError: true,
  })

  const pickCategory = (record: Record<string, unknown>, category: string | undefined) =>
    category ? { [category]: record[category] } : record

  // Reload the config if it changed on disk before every tool call.
  const tool: typeof server.registerTool = (name, config, handler) =>
    server.registerTool(name, config, (async (...args: unknown[]) => {
      await syncConfig()
      return (handler as (...args: unknown[]) => unknown)(...args)
    }) as typeof handler)

  tool(
    'get_tokens',
    {
      description: 'Get all design tokens with their values, CSS variables, and usage examples',
      inputSchema: { category: nameSchema('Filter by token category') },
    },
    async ({ category }) => {
      const { tokens } = driver.introspect.spec
      if (category && !(category in tokens.categories)) {
        return unknownName('token category', category, Object.keys(tokens.categories))
      }
      const categories = category ? { [category]: tokens.categories[category] } : tokens.categories
      const values = category
        ? Object.fromEntries(Object.entries(tokens.values).filter(([path]) => path.startsWith(`${category}.`)))
        : tokens.values
      return json({ categories, values, deprecated: Object.keys(tokens.deprecated) })
    },
  )

  tool(
    'get_semantic_tokens',
    {
      description: 'Get semantic tokens with their conditional values (responsive, color modes)',
      inputSchema: { category: nameSchema('Filter by token category') },
    },
    async ({ category }) => {
      const categories = Object.keys(driver.introspect.spec.tokens.categories)
      if (category && !categories.includes(category)) return unknownName('token category', category, categories)
      const semanticTokens = (theme().semanticTokens ?? {}) as Record<string, unknown>
      return json(pickCategory(semanticTokens, category))
    },
  )

  tool(
    'get_recipes',
    {
      description: 'Get component recipes with their variants, default values, and usage examples',
      inputSchema: { name: nameSchema('Filter by recipe name') },
    },
    async ({ name }) => {
      const { recipes, slotRecipes } = driver.introspect.spec
      if (!name) return json({ recipes, slotRecipes })
      if (!(name in recipes) && !(name in slotRecipes)) {
        return unknownName('recipe', name, driver.introspect.recipes())
      }
      return json({
        recipes: pickCategory(recipes, name in recipes ? name : undefined),
        slotRecipes: pickCategory(slotRecipes, name in slotRecipes ? name : undefined),
      })
    },
  )

  tool(
    'get_patterns',
    {
      description: 'Get layout patterns with their properties and usage examples',
      inputSchema: { name: nameSchema('Filter by pattern name') },
    },
    async ({ name }) => {
      const { patterns } = driver.introspect.spec
      if (name && !(name in patterns)) return unknownName('pattern', name, driver.introspect.patterns())
      return json(pickCategory(patterns, name))
    },
  )

  tool(
    'get_conditions',
    { description: 'Get all conditions (breakpoints, pseudo-classes, color modes) and their CSS values' },
    async () =>
      json({
        ...driver.introspect.spec.conditions,
        definitions: theme().conditions ?? driver.config.conditions ?? {},
      }),
  )

  tool('get_keyframes', { description: 'Get keyframe animations defined in the theme' }, async () =>
    json(theme().keyframes ?? {}),
  )

  tool('get_text_styles', { description: 'Get text style compositions for typography' }, async () =>
    json(theme().textStyles ?? {}),
  )

  tool('get_layer_styles', { description: 'Get layer style compositions for visual styling' }, async () =>
    json(theme().layerStyles ?? {}),
  )

  tool('get_animation_styles', { description: 'Get animation style compositions' }, async () =>
    json(theme().animationStyles ?? {}),
  )

  tool('get_color_palette', { description: 'Get the color palette with all color values' }, async () => {
    const { tokens } = driver.introspect.spec
    return json({
      colorPalettes: tokens.colorPalettes,
      colors: Object.fromEntries(Object.entries(tokens.values).filter(([path]) => path.startsWith('colors.'))),
    })
  })

  tool(
    'get_config',
    { description: 'Get the resolved Panda CSS configuration including paths, JSX settings, and output options' },
    async () => json(driver.config),
  )

  tool(
    'get_usage_report',
    {
      description:
        'Scan project sources for token, recipe, utility, pattern, and keyframe usage, including unused configured names and source locations.',
      inputSchema: {
        scope: z
          .enum(['all', 'tokens', 'recipes', 'utilities', 'patterns', 'keyframes'])
          .optional()
          .describe('Report scope (defaults to all)'),
      },
    },
    async ({ scope }) => {
      const { report, diagnostics } = analyzeSources(driver.compiler, driver.scan(), scope)

      return {
        ...json({ ...report, diagnostics }),
        isError: diagnostics.some(
          (diagnostic) => diagnostic.severity === 'error' || diagnostic.code === 'js_parse_error',
        ),
      }
    },
  )

  return server
}

/** Reloads the driver when the config file or any file it imports changed on disk since the last check. */
function createConfigSync(driver: Driver) {
  const readConfigStamp = () => {
    const paths = driver.configPath ? [driver.configPath] : []
    for (const dep of driver.configDependencies ?? []) paths.push(driver.resolvePath(dep))
    for (const target of driver.designSystemWatchTargets?.() ?? []) {
      paths.push(target.manifestPath, target.buildInfoPath, target.presetPath)
    }
    return paths.map(fileStamp).join('|')
  }

  let lastLoadedStamp = readConfigStamp()
  let pending: Promise<void> | undefined

  async function reloadIfChanged() {
    const nextStamp = readConfigStamp()
    if (nextStamp === lastLoadedStamp) return

    await driver.reload()

    // Keep the pre-reload stamp so edits made during the reload are detected next time.
    lastLoadedStamp = nextStamp
  }

  return function syncConfig() {
    if (pending) return pending

    pending = reloadIfChanged().finally(() => {
      pending = undefined
    })

    return pending
  }
}

function fileStamp(path: string) {
  try {
    const stat = statSync(path)
    return `${path}:${stat.mtimeMs}:${stat.size}`
  } catch {
    return `${path}:missing`
  }
}

export interface StartMcpServerOptions {
  cwd?: string
  config?: string
  silent?: boolean
  transport?: Transport
}

/**
 * Start the MCP server with the given options.
 * By default, uses StdioServerTransport for CLI usage.
 */
export async function startMcpServer(options: StartMcpServerOptions = {}) {
  const { cwd = process.cwd(), config: configPath, silent = false, transport } = options

  const resolvedCwd = resolve(cwd)
  const resolvedConfigPath = configPath ? resolve(configPath) : undefined

  // Load the compiler driver
  const driver = await createNodeDriver({
    cwd: resolvedCwd,
    configPath: resolvedConfigPath,
  })

  // Create MCP server
  const server = createMcpServer({ driver })

  // Connect to transport
  const serverTransport = transport ?? new StdioServerTransport()

  // Own process exit only for the default stdio transport, not injected test ones.
  if (!transport) {
    exitOnDisconnect()
  }

  await server.connect(serverTransport)

  // Use stderr for logging (stdout is reserved for MCP protocol)
  if (!silent) {
    console.error('Panda CSS MCP server started')
    console.error(`Working directory: ${resolvedCwd}`)
    if (resolvedConfigPath) {
      console.error(`Config path: ${resolvedConfigPath}`)
    }
  }

  return server
}

export interface ExitOnDisconnectOptions {
  stdin?: { on(event: string, listener: () => void): unknown }
  on?: (event: string, listener: () => void) => unknown
  exit?: (code: number) => void
}

// Exit on host disconnect (stdin EOF) or termination signal instead of orphaning;
// the SDK transport keeps the process alive but never exits on its own.
export function exitOnDisconnect(options: ExitOnDisconnectOptions = {}) {
  const stdin = options.stdin ?? process.stdin
  const on = options.on ?? process.on.bind(process)
  const exit = options.exit ?? ((code: number) => process.exit(code))

  stdin.on('end', () => exit(0))
  stdin.on('close', () => exit(0))
  on('SIGINT', () => exit(0))
  on('SIGTERM', () => exit(0))
  on('SIGHUP', () => exit(0))
}
