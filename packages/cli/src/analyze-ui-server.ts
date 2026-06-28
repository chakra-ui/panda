import type { UsageReport } from '@pandacss/compiler-shared'
import { createServer, type Server, type ServerResponse } from 'node:http'
import { renderAnalyzeHtml } from './analyze-report'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 9324

export interface AnalyzeUiServerOptions {
  host?: string
  port?: string | number
  report: UsageReport
}

export interface AnalyzeUiServer {
  url: string
  update(report: UsageReport): void
  close(): Promise<void>
}

export async function startAnalyzeUiServer(options: AnalyzeUiServerOptions): Promise<AnalyzeUiServer> {
  let currentReport = options.report
  const clients = new Set<ServerResponse>()
  const host = options.host || DEFAULT_HOST
  const preferredPort = parsePort(options.port)

  const server = createServer((request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || `${host}:${preferredPort}`}`)

    if (url.pathname === '/' || url.pathname === '/index.html') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      response.end(renderAnalyzeHtml())
      return
    }

    if (url.pathname === '/api/report') {
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
      })
      response.end(JSON.stringify(currentReport))
      return
    }

    if (url.pathname === '/events') {
      response.writeHead(200, {
        'cache-control': 'no-store',
        connection: 'keep-alive',
        'content-type': 'text/event-stream; charset=utf-8',
      })
      response.write('event: ready\ndata: {}\n\n')
      clients.add(response)
      request.on('close', () => {
        clients.delete(response)
      })
      return
    }

    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Not found')
  })

  const address = await listen(server, { host, port: preferredPort })
  const url = `http://${host}:${address.port}`

  return {
    url,
    update(report) {
      currentReport = report
      for (const client of clients) {
        client.write('event: report\ndata: {}\n\n')
      }
    },
    async close() {
      for (const client of clients) {
        client.end()
      }
      clients.clear()
      await close(server)
    },
  }
}

function parsePort(value: AnalyzeUiServerOptions['port']): number {
  if (value === undefined || value === 'auto') return DEFAULT_PORT

  const port = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(port) && port >= 0 && port <= 65535 ? port : DEFAULT_PORT
}

function listen(server: Server, options: { host: string; port: number }): Promise<{ port: number }> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off('error', onError)
      server.off('listening', onListening)
    }

    const retryOnAnyPort = () => {
      server.listen(0, options.host)
    }

    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && options.port !== 0) {
        server.off('error', onError)
        server.once('error', reject)
        retryOnAnyPort()
        return
      }

      cleanup()
      reject(error)
    }

    const onListening = () => {
      cleanup()
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine analyze UI server address'))
        return
      }
      resolve({ port: address.port })
    }

    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(options.port, options.host)
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
