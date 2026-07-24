import { PandaError } from '@pandacss/shared'

/**
 * MCP was moved out of `@pandacss/dev` so installs no longer pull the MCP SDK
 * (and its Hono dependency) into every project.
 */
export function createMcpMovedError(command: 'mcp' | 'init-mcp') {
  const replacement = command === 'init-mcp' ? 'npx -y @pandacss/mcp init' : 'npx -y @pandacss/mcp'

  return new PandaError('MCP_MOVED', `\`panda ${command}\` was moved out of @pandacss/dev for security reasons.`, {
    hint: [
      'The MCP SDK (and Hono) are no longer installed with @pandacss/dev.',
      `Use \`${replacement}\` instead.`,
      'See https://panda-css.com/docs/ai/mcp-server',
    ].join('\n'),
  })
}
