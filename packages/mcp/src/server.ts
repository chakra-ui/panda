import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { createNodeDriver, type Driver } from '@pandacss/compiler'
import { resolve } from 'path'
import * as z from 'zod/v4'

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
  const spec = driver.introspect.spec
  const theme = (driver.config.theme ?? {}) as Record<string, unknown>

  const server = new McpServer({
    name: '@pandacss/mcp',
    version: '1.0.0',
  })

  // Create dynamic schemas from user's config
  const tokenCategories = Object.keys(spec.tokens.categories) as [string, ...string[]]
  const recipeNames = driver.introspect.recipes() as [string, ...string[]]
  const patternNames = driver.introspect.patterns() as [string, ...string[]]

  const tokenCategorySchema = (tokenCategories.length ? z.enum(tokenCategories) : z.string())
    .optional()
    .describe('Filter by token category')

  const recipeNameSchema = recipeNames.length
    ? z.enum(recipeNames).optional().describe('Filter by recipe name')
    : z.string().optional().describe('Filter by recipe name')

  const patternNameSchema = patternNames.length
    ? z.enum(patternNames).optional().describe('Filter by pattern name')
    : z.string().optional().describe('Filter by pattern name')

  const pickCategory = (record: Record<string, unknown>, category: string | undefined) =>
    category ? { [category]: record[category] } : record

  // Register tools
  server.registerTool(
    'get_tokens',
    {
      description: 'Get all design tokens with their values, CSS variables, and usage examples',
      inputSchema: { category: tokenCategorySchema },
    },
    async ({ category }) => {
      const categories = category ? { [category]: spec.tokens.categories[category] } : spec.tokens.categories
      const values = category
        ? Object.fromEntries(Object.entries(spec.tokens.values).filter(([path]) => path.startsWith(`${category}.`)))
        : spec.tokens.values
      return json({ categories, values, deprecated: Object.keys(spec.tokens.deprecated) })
    },
  )

  server.registerTool(
    'get_semantic_tokens',
    {
      description: 'Get semantic tokens with their conditional values (responsive, color modes)',
      inputSchema: { category: tokenCategorySchema },
    },
    async ({ category }) => {
      const semanticTokens = (theme.semanticTokens ?? {}) as Record<string, unknown>
      return json(pickCategory(semanticTokens, category))
    },
  )

  server.registerTool(
    'get_recipes',
    {
      description: 'Get component recipes with their variants, default values, and usage examples',
      inputSchema: { name: recipeNameSchema },
    },
    async ({ name }) => {
      const { recipes, slotRecipes } = spec
      if (name) {
        return json({
          recipes: pickCategory(recipes, name in recipes ? name : undefined),
          slotRecipes: pickCategory(slotRecipes, name in slotRecipes ? name : undefined),
        })
      }
      return json({ recipes, slotRecipes })
    },
  )

  server.registerTool(
    'get_patterns',
    {
      description: 'Get layout patterns with their properties and usage examples',
      inputSchema: { name: patternNameSchema },
    },
    async ({ name }) => json(pickCategory(spec.patterns, name)),
  )

  server.registerTool(
    'get_conditions',
    { description: 'Get all conditions (breakpoints, pseudo-classes, color modes) and their CSS values' },
    async () => json({ ...spec.conditions, definitions: theme.conditions ?? driver.config.conditions ?? {} }),
  )

  server.registerTool('get_keyframes', { description: 'Get keyframe animations defined in the theme' }, async () =>
    json(theme.keyframes ?? {}),
  )

  server.registerTool('get_text_styles', { description: 'Get text style compositions for typography' }, async () =>
    json(theme.textStyles ?? {}),
  )

  server.registerTool(
    'get_layer_styles',
    { description: 'Get layer style compositions for visual styling' },
    async () => json(theme.layerStyles ?? {}),
  )

  server.registerTool('get_animation_styles', { description: 'Get animation style compositions' }, async () =>
    json(theme.animationStyles ?? {}),
  )

  server.registerTool('get_color_palette', { description: 'Get the color palette with all color values' }, async () =>
    json({
      colorPalettes: spec.tokens.colorPalettes,
      colors: Object.fromEntries(Object.entries(spec.tokens.values).filter(([path]) => path.startsWith('colors.'))),
    }),
  )

  server.registerTool(
    'get_config',
    { description: 'Get the resolved Panda CSS configuration including paths, JSX settings, and output options' },
    async () => json(driver.config),
  )

  return server
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
