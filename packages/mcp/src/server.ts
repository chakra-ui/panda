import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { logger } from '@pandacss/logger'
import { analyze, loadConfigAndCreateContext, type PandaContext } from '@pandacss/node'
import { TOKEN_CATEGORIES } from '@pandacss/token-dictionary'
import { resolve } from 'path'
import * as z from 'zod/v4'

const tokenCategorySchema = z
  .enum(TOKEN_CATEGORIES as [string, ...string[]])
  .optional()
  .describe('Filter by token category')

const json = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data) }],
})

export interface CreateMcpServerOptions {
  ctx: PandaContext
}

/**
 * Create an MCP server with all tools registered.
 * This is separated from `startMcpServer` to allow testing with custom transports.
 */
export function createMcpServer(options: CreateMcpServerOptions) {
  const { ctx } = options

  const server = new McpServer({
    name: '@pandacss/mcp',
    version: '1.0.0',
  })

  // Create dynamic schemas from user's config
  const recipeNames = ctx.recipes.keys as [string, ...string[]]
  const patternNames = ctx.patterns.keys as [string, ...string[]]

  const recipeNameSchema = recipeNames.length
    ? z.enum(recipeNames).optional().describe('Filter by recipe name')
    : z.string().optional().describe('Filter by recipe name')

  const patternNameSchema = patternNames.length
    ? z.enum(patternNames).optional().describe('Filter by pattern name')
    : z.string().optional().describe('Filter by pattern name')

  // Register tools
  server.registerTool(
    'get_tokens',
    {
      description: 'Get all design tokens with their values, CSS variables, and usage examples',
      inputSchema: { category: tokenCategorySchema },
    },
    async ({ category }) => {
      const spec = ctx.getSpecOfType('tokens')
      const data = category ? spec.data.filter((group: any) => group.type === category) : spec.data
      return json({ type: spec.type, data })
    },
  )

  server.registerTool(
    'get_semantic_tokens',
    {
      description: 'Get semantic tokens with their conditional values (responsive, color modes)',
      inputSchema: { category: tokenCategorySchema },
    },
    async ({ category }) => {
      const spec = ctx.getSpecOfType('semantic-tokens')
      const data = category ? spec.data.filter((group: any) => group.type === category) : spec.data
      return json({ type: spec.type, data })
    },
  )

  server.registerTool(
    'get_recipes',
    {
      description: 'Get component recipes with their variants, default values, and usage examples',
      inputSchema: { name: recipeNameSchema },
    },
    async ({ name }) => {
      const spec = ctx.getSpecOfType('recipes')
      const data = name ? spec.data.filter((item: any) => item.name === name) : spec.data
      return json({ type: spec.type, data })
    },
  )

  server.registerTool(
    'get_patterns',
    {
      description: 'Get layout patterns with their properties and usage examples',
      inputSchema: { name: patternNameSchema },
    },
    async ({ name }) => {
      const spec = ctx.getSpecOfType('patterns')
      const data = name ? spec.data.filter((item: any) => item.name === name) : spec.data
      return json({ type: spec.type, data })
    },
  )

  server.registerTool(
    'get_conditions',
    { description: 'Get all conditions (breakpoints, pseudo-classes, color modes) and their CSS values' },
    async () => json(ctx.getSpecOfType('conditions')),
  )

  server.registerTool('get_keyframes', { description: 'Get keyframe animations defined in the theme' }, async () =>
    json(ctx.getSpecOfType('keyframes')),
  )

  server.registerTool('get_text_styles', { description: 'Get text style compositions for typography' }, async () =>
    json(ctx.getSpecOfType('text-styles')),
  )

  server.registerTool(
    'get_layer_styles',
    { description: 'Get layer style compositions for visual styling' },
    async () => json(ctx.getSpecOfType('layer-styles')),
  )

  server.registerTool('get_animation_styles', { description: 'Get animation style compositions' }, async () =>
    json(ctx.getSpecOfType('animation-styles')),
  )

  server.registerTool('get_color_palette', { description: 'Get the color palette with all color values' }, async () =>
    json(ctx.getSpecOfType('color-palette')),
  )

  server.registerTool(
    'get_config',
    { description: 'Get the resolved Panda CSS configuration including paths, JSX settings, and output options' },
    async () => json(ctx.config),
  )

  server.registerTool(
    'get_usage_report',
    {
      description:
        'Get a usage report of design tokens and recipes across the codebase. Shows which tokens/recipes are used, unused, or missing. Useful for auditing, cleanup, and identifying dead code.',
      inputSchema: {
        scope: z
          .enum(['all', 'token', 'recipe'])
          .optional()
          .describe('Analysis scope: token, recipe, or all (default)'),
      },
    },
    async ({ scope }) => {
      const result = analyze(ctx)
      const includeTokens = !scope || scope === 'all' || scope === 'token'
      const includeRecipes = !scope || scope === 'all' || scope === 'recipe'

      const report: Record<string, unknown> = {}

      if (includeTokens && !ctx.tokens.isEmpty) {
        const tokenReport = result.getTokenReport()
        report.tokens = tokenReport.report.getSummary()
      }

      if (includeRecipes && !ctx.recipes.isEmpty()) {
        const recipeReport = result.getRecipeReport()
        report.recipes = recipeReport.report
      }

      return json(report)
    },
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

  if (silent) {
    logger.level = 'silent'
  }

  const resolvedCwd = resolve(cwd)
  const resolvedConfigPath = configPath ? resolve(configPath) : undefined

  // Load Panda context
  const ctx = await loadConfigAndCreateContext({
    cwd: resolvedCwd,
    configPath: resolvedConfigPath,
  })

  // Create MCP server
  const server = createMcpServer({ ctx })

  // Connect to transport
  const serverTransport = transport ?? new StdioServerTransport()
  await server.connect(serverTransport)

  // Only own the lifecycle for the default stdio transport, not injected test ones.
  if (!transport) {
    watchProcessLifecycle(server)
  }

  // Use stderr for logging (stdout is reserved for MCP protocol)
  console.error('Panda CSS MCP server started')
  console.error(`Working directory: ${resolvedCwd}`)
  if (resolvedConfigPath) {
    console.error(`Config path: ${resolvedConfigPath}`)
  }

  return server
}

type LifecycleListener = (arg: any) => void

export interface ProcessLike {
  stdin: { on(event: string, listener: LifecycleListener): unknown }
  stdout: { on(event: string, listener: LifecycleListener): unknown; write(data: string): unknown }
  stderr: { on(event: string, listener: LifecycleListener): unknown; write(data: string): unknown }
  on(event: string, listener: LifecycleListener): unknown
}

export interface ProcessLifecycleOptions {
  process?: ProcessLike
  exit?: (code: number) => void
}

/**
 * Exit the stdio MCP server on host disconnect or fatal error instead of orphaning
 * and spinning at 100% CPU. See https://github.com/chakra-ui/panda/issues/3553.
 */
export function watchProcessLifecycle(server: Pick<McpServer, 'close'>, options: ProcessLifecycleOptions = {}) {
  const proc = options.process ?? process
  const exit = options.exit ?? ((code: number) => process.exit(code))

  let exiting = false
  const shutdown = (code: number) => {
    if (exiting) return
    exiting = true
    void Promise.resolve(server.close()).catch(() => {})
    exit(code)
  }

  // Host closed the pipe (session ended) -> stop instead of orphaning.
  proc.stdin.on('end', () => shutdown(0))
  proc.stdin.on('close', () => shutdown(0))

  // Swallow broken pipes so they don't reach the fatal path and spin.
  for (const stream of [proc.stdout, proc.stderr]) {
    stream.on('error', (err: NodeJS.ErrnoException) => {
      if (err?.code === 'EPIPE') shutdown(0)
    })
  }

  const onFatal = (label: string) => (err: unknown) => {
    try {
      proc.stderr.write(`[panda mcp] ${label}, exiting: ${formatError(err)}\n`)
    } catch {
      // stderr may also be a broken pipe; swallow so we exit, not loop.
    }
    shutdown(1)
  }
  proc.on('uncaughtException', onFatal('uncaught exception'))
  proc.on('unhandledRejection', onFatal('unhandled rejection'))

  return shutdown
}

function formatError(err: unknown) {
  return err instanceof Error ? err.stack ?? err.message : String(err)
}
