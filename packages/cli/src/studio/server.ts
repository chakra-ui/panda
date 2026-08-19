import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 4000

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

export interface StudioServerOptions {
  host?: string
  port?: string | number
}

export interface StudioServer {
  url: string
  close(): Promise<void>
}

export async function serveStudio(dir: string, options: StudioServerOptions = {}): Promise<StudioServer> {
  const host = options.host || DEFAULT_HOST
  const preferredPort = parsePort(options.port)

  const server = createServer((request, response) => {
    const pathname = new URL(request.url || '/', `http://${host}`).pathname
    const requestPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
    const file = normalize(join(dir, requestPath))
    if (file !== dir && !file.startsWith(dir + sep)) {
      response.writeHead(403).end('Forbidden')
      return
    }

    readFile(file).then(
      (body) => {
        response.writeHead(200, { 'content-type': CONTENT_TYPES[extname(file)] || 'application/octet-stream' })
        response.end(body)
      },
      () => {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found')
      },
    )
  })

  const address = await listen(server, { host, port: preferredPort })
  return {
    url: `http://${host}:${address.port}`,
    close: () => close(server),
  }
}

function parsePort(value: StudioServerOptions['port']): number {
  if (value === undefined) return DEFAULT_PORT
  const port = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(port) && port >= 0 && port <= 65535 ? port : DEFAULT_PORT
}

function listen(server: Server, options: { host: string; port: number }): Promise<{ port: number }> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off('error', onError)
      server.off('listening', onListening)
    }

    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && options.port !== 0) {
        server.off('error', onError)
        server.once('error', reject)
        server.listen(0, options.host)
        return
      }
      cleanup()
      reject(error)
    }

    const onListening = () => {
      cleanup()
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine studio server address'))
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
    server.close((error) => (error ? reject(error) : resolve()))
  })
}
