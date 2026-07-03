import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import { pathToFileURL } from 'node:url'
import {
  createConnection,
  createProtocolConnection,
  StreamMessageReader,
  StreamMessageWriter,
  CompletionRequest,
  HoverRequest,
  DidOpenTextDocumentNotification,
  InitializeRequest,
  type Position,
} from 'vscode-languageserver/node.js'
import { afterEach, describe, expect, it } from 'vitest'
import { createServer } from '../src'

const PROJECT_DIR = join(import.meta.dirname, 'fixtures/sample-project')
const CONFIG_URI = pathToFileURL(join(PROJECT_DIR, 'panda.config.ts')).toString()

function offsetToPosition(text: string, offset: number): Position {
  const before = text.slice(0, offset)
  const lines = before.split('\n')
  return { line: lines.length - 1, character: lines.at(-1)?.length ?? 0 }
}

// Wires two real vscode-languageserver connections back to back over an in-memory
// duplex pipe — the same reader/writer machinery a real stdio client<->server pair
// uses, just without an actual subprocess boundary. `client` stands in for the
// editor (Neovim, Zed, ...); `server` is ours.
function connectEditorToServer() {
  const clientToServer = new PassThrough()
  const serverToClient = new PassThrough()

  const server = createConnection(new StreamMessageReader(clientToServer), new StreamMessageWriter(serverToClient))
  const client = createProtocolConnection(
    new StreamMessageReader(serverToClient),
    new StreamMessageWriter(clientToServer),
  )

  createServer(server)
  client.listen()

  return { server, client }
}

describe('an editor talking to panda-language-server', () => {
  const teardown: Array<() => void> = []
  afterEach(() => {
    while (teardown.length) teardown.pop()?.()
  })

  async function openConfigFile(client: ReturnType<typeof connectEditorToServer>['client'], text: string) {
    await client.sendRequest(InitializeRequest.type, { processId: null, rootUri: null, capabilities: {} })
    await client.sendNotification(DidOpenTextDocumentNotification.type, {
      textDocument: { uri: CONFIG_URI, languageId: 'typescript', version: 1, text },
    })
  }

  it('suggests a matching color while the user types inside a global style rule', async () => {
    const { server, client } = connectEditorToServer()
    teardown.push(() => {
      client.end()
      server.dispose()
    })

    const text = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { color: 're' } }),
      })
    `
    await openConfigFile(client, text)

    const position = offsetToPosition(text, text.indexOf("'re'") + 3)
    const completions = await client.sendRequest(CompletionRequest.type, {
      textDocument: { uri: CONFIG_URI },
      position,
    })

    const labels = (Array.isArray(completions) ? completions : completions?.items ?? []).map((item) => item.label)
    expect(labels).toContain('red.500')
  })

  it("suggests utility and condition names while the user starts a new line in a recipe's base styles", async () => {
    const { server, client } = connectEditorToServer()
    teardown.push(() => {
      client.end()
      server.dispose()
    })

    const text = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: {  } }) },
      })
    `
    await openConfigFile(client, text)

    const position = offsetToPosition(text, text.indexOf('{  }') + 1)
    const completions = await client.sendRequest(CompletionRequest.type, {
      textDocument: { uri: CONFIG_URI },
      position,
    })

    const labels = (Array.isArray(completions) ? completions : completions?.items ?? []).map((item) => item.label)
    expect(labels).toEqual(expect.arrayContaining(['color', '_hover']))
  })

  it('shows the resolved color when the user hovers a token reference', async () => {
    const { server, client } = connectEditorToServer()
    teardown.push(() => {
      client.end()
      server.dispose()
    })

    const text = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({
        theme: { semanticTokens: { colors: { danger: { value: '{colors.red.500}' } } } },
      })
    `
    await openConfigFile(client, text)

    const position = offsetToPosition(text, text.indexOf('colors.red.500') + 3)
    const hover = await client.sendRequest(HoverRequest.type, { textDocument: { uri: CONFIG_URI }, position })

    expect(hover?.contents).toMatchObject({ kind: 'plaintext', value: 'colors.red.500\n#f00' })
  })
})
