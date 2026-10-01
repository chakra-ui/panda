import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { Driver } from '@pandacss/compiler'
import { createMcpServer } from '../src/server'

export async function withClient(run: (client: Client) => Promise<void>, driver: Driver = emptyDriver()) {
  const server = createMcpServer({ driver })
  const client = new Client({ name: 'panda-mcp-test', version: '1.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  try {
    await server.connect(serverTransport)
    await client.connect(clientTransport)
    await run(client)
  } finally {
    await client.close()
    await server.close()
  }
}

function emptyDriver(): Driver {
  return {
    config: { theme: {} },
    introspect: {
      spec: { tokens: { categories: {} } },
      recipes: () => [],
      patterns: () => [],
    },
  } as unknown as Driver
}
