import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { UsageReport } from '@pandacss/compiler-shared'

export interface StudioSource {
  path: string
  text: string
}

/** What the bridge page relays into Studio. Studio's `useStudioBridge` reads the same shapes. */
export type StudioMessage =
  | { type: 'system'; spec: string }
  | { type: 'report'; report: UsageReport }
  | { type: 'sources'; files: StudioSource[] }
  | { type: 'source'; path: string; text: string }
  | { type: 'removed'; path: string }

export interface StudioServerOptions {
  port: number
  token: string
  /** Hosted Studio page the bridge frames, e.g. `https://studio.panda-css.com/view`. */
  studioUrl: string
  /** Everything a newly connected page needs before live updates. */
  snapshot(): StudioMessage[]
  onConnect?(): void
  /** A request with a missing or stale token, usually a tab left from an earlier run. */
  onReject?(): void
}

export interface StudioServer {
  url: string
  port: number
  broadcast(message: StudioMessage): void
  close(): Promise<void>
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:\d+)?$/
const KEEPALIVE_MS = 15_000

export function startStudioServer(options: StudioServerOptions): Promise<StudioServer> {
  const clients = new Set<ServerResponse>()
  const write = (res: ServerResponse, message: StudioMessage) => res.write(`data: ${JSON.stringify(message)}\n\n`)

  const server = createServer((req, res) => {
    // DNS rebinding: a page on another name that resolves to 127.0.0.1 still sends its own Host.
    if (!LOCAL_HOST.test(req.headers.host ?? '')) return void res.writeHead(403).end()

    const url = new URL(req.url ?? '/', 'http://localhost')
    const authorized = url.searchParams.get('token') === options.token

    if (url.pathname === '/' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      return void res.end(authorized ? bridgePage(options.studioUrl, options.token) : missingTokenPage())
    }

    if (url.pathname === '/events' && req.method === 'GET') {
      if (!authorized) {
        options.onReject?.()
        return void res.writeHead(401).end()
      }
      openStream(req, res)
      options.onConnect?.()
      return
    }

    res.writeHead(404).end()
  })

  const openStream = (req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    })
    for (const message of options.snapshot()) write(res, message)
    clients.add(res)
    const keepalive = setInterval(() => res.write(': keepalive\n\n'), KEEPALIVE_MS)
    req.on('close', () => {
      clearInterval(keepalive)
      clients.delete(res)
    })
  }

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port, '127.0.0.1', () => {
      server.off('error', reject)
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : options.port
      resolve({
        port,
        url: `http://localhost:${port}/?token=${options.token}`,
        broadcast(message) {
          for (const res of clients) write(res, message)
        },
        close() {
          for (const res of clients) res.end()
          clients.clear()
          return new Promise((done) => server.close(() => done()))
        },
      })
    })
  })
}

export function bridgePage(studioUrl: string, token: string): string {
  const origin = new URL(studioUrl).origin
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panda Studio</title>
<style>html,body,iframe{margin:0;border:0;width:100%;height:100%;display:block}</style>
<iframe id="studio" src="${escapeAttribute(studioUrl)}" title="Panda Studio"></iframe>
<script>
const origin = ${JSON.stringify(origin)}
const frame = document.getElementById('studio')
const send = (message) => frame.contentWindow.postMessage(message, origin)
let events
window.addEventListener('message', (event) => {
  if (event.origin !== origin || event.data?.type !== 'ready') return
  events?.close()
  events = new EventSource('/events?token=' + ${JSON.stringify(encodeURIComponent(token))})
  events.onopen = () => send({ type: 'status', live: true })
  events.onerror = () => send({ type: 'status', live: false })
  events.onmessage = (message) => send(JSON.parse(message.data))
})
</script>
</html>`
}

function missingTokenPage(): string {
  return `<!doctype html><meta charset="utf-8"><title>Panda Studio</title>
<p style="font:14px system-ui;margin:48px auto;max-width:36em">Open the link that <code>panda studio</code> printed in your terminal. It includes the token this page needs.</p>`
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
