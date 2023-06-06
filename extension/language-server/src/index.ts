import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  type ServerRequestHandler,
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { setupBuilder } from './setup-builder'
import { setupTokensHelpers } from './tokens/setup-tokens-helpers'
import * as features from './features'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const original = createConnection(ProposedFeatures.all)

// Wrap the connection in a proxy to be able to register multiple handlers for the same event
// ex: onDidChangeWatchedFiles
const connection = createConnectionProxy() as typeof original

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument)

let isDebug = false

// Deferred promise to wait for extension to have resolved all the workspaces configs
let resolveDeferred: (value?: unknown) => void
const deferred = new Promise((resolve) => {
  resolveDeferred = resolve
})

// Initialize extension.
const setup = setupBuilder(connection, documents, {
  onDidChangeConfiguration: (settings) => {
    isDebug = settings['debug.enabled'] ?? false
  },
  onReady() {
    resolveDeferred()
  },
})

// Most of the tokens retrieval logic is shared between features
const tokensHelpers = setupTokensHelpers(setup)

/**
 * Debug message helper
 */
function debug(message: string) {
  isDebug && connection.console.log(message)
}

/**
 * 1 - wait for the extension to have resolved all the workspaces configs before doing anything
 * 2 - Check await until tokens are synchronized if a synchronization process is happening.
 *
 * should be used AFTER checking that the feature is enabled through settings
 * and BEFORE getting the current context
 */
async function documentReady(step: string) {
  // wait for the extension to have resolved all the workspaces configs before doing anything
  await deferred

  try {
    if (setup.isSynchronizing()) {
      await setup.isSynchronizing()
    }

    debug(step)
  } catch (error) {
    connection.console.error('error on step ' + step)
    connection.console.error(error as any)
  }
}

/**
 * Extension context to be injected into features.
 */
const extension = {
  connection,
  documents,
  debug,
  documentReady,
  ...setup,
  ...tokensHelpers,
} as const

/**
 * Register each language server feature with extension context.
 * wait for the extension to have resolved all the workspaces configs before doing anything
 */
Object.entries(features).forEach(([key, registerFeature]) => {
  debug(`🐼 Feature: ${key}`)
  registerFeature(extension)
})

export type PandaExtension = typeof extension

type EventKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? (K extends `on${string}` ? K : never) : never
}[keyof T]
type ConnectionEvents = EventKeys<typeof original>

function createConnectionProxy(): Pick<typeof original, ConnectionEvents> {
  const ignoredEvents = ['onNotification', 'onRequest', 'onInitialize']
  const eventMap = new Map<string, any[]>()

  return new Proxy(original, {
    get(target, prop) {
      if (typeof prop === 'string' && prop.startsWith('on') && !ignoredEvents.includes(prop)) {
        const handlers = eventMap.get(prop) ?? []
        eventMap.set(prop, handlers)

        // @ts-ignore
        target[prop].call(target, (...args: any[]) => {
          let result
          handlers.forEach((handler) => {
            result = handler(...args)
          })

          return result
        })
        return (handler: ServerRequestHandler<any, any, any, any>) => {
          handlers.push(handler)
        }
      }

      // @ts-ignore
      return target[prop]
    },
  })
}
