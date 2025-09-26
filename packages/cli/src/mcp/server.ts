import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest } from '@modelcontextprotocol/sdk/types.js'
import { logger } from '@pandacss/logger'
import {
  getCompositions,
  getRecipe,
  getRecipeProps,
  getRecipes,
  getConfig,
  listBreakpoints,
  listKeyframesAndAnimations,
  listLayerStyles,
  listRecipes,
  listSemanticTokens,
  listCompositionStyles,
  listTextStyles,
  listTokens,
} from './tools'
import { clearConfigCache, setGlobalConfigOptions } from './load-config'

export interface McpServerOptions {
  cwd?: string
  configPath?: string
}

export class PandaMcpServer {
  private server: Server
  private options: McpServerOptions

  constructor(options: McpServerOptions = {}) {
    this.server = new Server(
      {
        name: '@pandacss/dev',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
      },
    )

    this.options = options
    this.setupToolHandlers()
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [
        // Token tools
        {
          name: 'tokens',
          description: 'List all design tokens with filtering options',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by token category' },
              search: { type: 'string', description: 'Search token names' },
              includeSemanticTokens: { type: 'boolean', description: 'Include semantic tokens' },
            },
          },
        },
        {
          name: 'list_tokens',
          description:
            'List regular design tokens (excludes semantic tokens) as simple strings, optionally filtered by category',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description:
                  'Filter by token category (colors, spacing, sizes, fonts, fontSizes, fontWeights, lineHeights, letterSpacings, shadows, radii, borders, durations, easings, animations, blurs, gradients, assets, borderWidths, aspectRatios, containerNames, zIndex, opacity, cursor)',
              },
            },
          },
        },
        {
          name: 'list_semantic_tokens',
          description: 'List semantic tokens (tokens with conditions like responsive, color modes) as simple strings',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description:
                  'Filter by token category (colors, spacing, sizes, fonts, fontSizes, fontWeights, lineHeights, letterSpacings, shadows, radii, borders, durations, easings, animations, blurs, gradients, assets, borderWidths, aspectRatios, containerNames, zIndex, opacity, cursor)',
              },
            },
          },
        },

        // Style composition tools
        {
          name: 'list_composition_styles',
          description: 'List reusable style compositions that help reduce CSS duplication',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['all', 'textStyles', 'layerStyles', 'animationStyles'],
                description: 'Filter by style composition type',
              },
            },
          },
        },
        {
          name: 'compositions',
          description: 'Get all style compositions (textStyles and layerStyles)',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['textStyles', 'layerStyles'], description: 'Type of composition to get' },
            },
          },
        },
        {
          name: 'list_textStyle',
          description: 'List text style compositions',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Search text style names' },
            },
          },
        },
        {
          name: 'list_layerStyle',
          description: 'List layer style compositions',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Search layer style names' },
            },
          },
        },

        // Responsive and animation tools
        {
          name: 'list_breakpoints',
          description: 'List responsive breakpoints',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['raw', 'css'], description: 'Output format for breakpoints' },
            },
          },
        },
        {
          name: 'list_keyframes_n_animations',
          description: 'List keyframes and animations',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['keyframes', 'animations', 'all'],
                description: 'Filter by animation type',
              },
            },
          },
        },

        // Recipe tools
        {
          name: 'recipes',
          description: 'Get all recipes with configuration',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['summary', 'detailed'], description: 'Level of detail in output' },
            },
          },
        },
        {
          name: 'list_recipes',
          description: 'List all recipe names',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_recipe',
          description: 'Get detailed information about a specific recipe',
          inputSchema: {
            type: 'object',
            properties: {
              recipeName: { type: 'string', description: 'The recipe name to get details for' },
            },
            required: ['recipeName'],
          },
        },
        {
          name: 'get_recipe_props',
          description: 'Get properties and variants for a specific recipe',
          inputSchema: {
            type: 'object',
            properties: {
              recipeName: { type: 'string', description: 'Name of the recipe to analyze' },
            },
            required: ['recipeName'],
          },
        },

        // Config tools
        {
          name: 'get_config',
          description: 'Get resolved Panda configuration',
          inputSchema: {
            type: 'object',
            properties: {
              section: {
                type: 'string',
                enum: ['all', 'theme', 'conditions', 'utilities', 'patterns', 'recipes', 'globalCss', 'staticCss'],
                description: 'Specific config section to return',
              },
            },
          },
        },
      ]

      logger.info('mcp', `Registering ${tools.length} tools`)
      return { tools }
    })

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      try {
        const { name, arguments: args = {} } = request.params

        // Set global config options for all tools to use
        setGlobalConfigOptions({
          cwd: this.options.cwd,
          configPath: this.options.configPath,
        })

        switch (name) {
          // Token tools
          case 'tokens':
          case 'list_tokens':
            return { content: [{ type: 'text', text: JSON.stringify(await listTokens(args), null, 2) }] }
          case 'list_semantic_tokens':
            return { content: [{ type: 'text', text: JSON.stringify(await listSemanticTokens(args), null, 2) }] }

          // Style composition tools
          case 'list_composition_styles':
            return { content: [{ type: 'text', text: JSON.stringify(await listCompositionStyles(args), null, 2) }] }
          case 'compositions':
            return { content: [{ type: 'text', text: JSON.stringify(await getCompositions(args), null, 2) }] }
          case 'list_textStyle':
            return { content: [{ type: 'text', text: JSON.stringify(await listTextStyles(args), null, 2) }] }
          case 'list_layerStyle':
            return { content: [{ type: 'text', text: JSON.stringify(await listLayerStyles(args), null, 2) }] }

          // Responsive and animation tools
          case 'list_breakpoints':
            return { content: [{ type: 'text', text: JSON.stringify(await listBreakpoints(), null, 2) }] }
          case 'list_keyframes_n_animations':
            return {
              content: [{ type: 'text', text: JSON.stringify(await listKeyframesAndAnimations(args), null, 2) }],
            }

          // Recipe tools
          case 'recipes':
            return { content: [{ type: 'text', text: JSON.stringify(await getRecipes(args), null, 2) }] }
          case 'list_recipes':
            return { content: [{ type: 'text', text: JSON.stringify(await listRecipes(args), null, 2) }] }
          case 'get_recipe':
            return { content: [{ type: 'text', text: JSON.stringify(await getRecipe(args as any), null, 2) }] }
          case 'get_recipe_props':
            return { content: [{ type: 'text', text: JSON.stringify(await getRecipeProps(args as any), null, 2) }] }

          // Config tools
          case 'get_config':
            return { content: [{ type: 'text', text: JSON.stringify(await getConfig(args), null, 2) }] }

          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('mcp:tool-call', `Tool ${request.params.name} failed: ${errorMessage}`)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: errorMessage,
                  tool: request.params.name,
                  timestamp: new Date().toISOString(),
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        }
      }
    })
  }

  async start() {
    // Clear any cached config when starting
    clearConfigCache()

    const transport = new StdioServerTransport()
    await this.server.connect(transport)

    logger.info('mcp', `Panda CSS MCP server started`)
    logger.info('mcp', `Working directory: ${this.options.cwd || process.cwd()}`)
    if (this.options.configPath) {
      logger.info('mcp', `Config path: ${this.options.configPath}`)
    }
  }

  async stop() {
    clearConfigCache()
    // Note: MCP SDK doesn't have an explicit stop method
    logger.info('mcp', 'Panda CSS MCP server stopped')
  }
}
