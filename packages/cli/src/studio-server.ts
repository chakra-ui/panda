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
  /** A request with a wrong token, usually a tab left from an earlier run. */
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
    const token = url.searchParams.get('token')
    const authorized = token === options.token

    if (url.pathname === '/' && req.method === 'GET') {
      if (token && !authorized) options.onReject?.()
      res.writeHead(authorized ? 200 : 401, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      return void res.end(authorized ? bridgePage(options.studioUrl, options.token) : tokenPage(Boolean(token)))
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
<link rel="icon" href="${FAVICON}">
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

const LOGO = `<svg width="28" height="28" aria-hidden="true" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="7" fill="#f6e458"/><svg x="7" y="7" width="18" height="18" viewBox="12 12 39 38"><path fill="#0b0b0b" d="M39.3279 13.8621C35.942 12.8895 32.4885 12.7573 28.969 13.0721C26.9995 13.2767 25.1061 13.6677 23.2797 14.3537C19.3321 15.8365 16.3681 18.4047 14.6007 22.2714C13.3337 25.0436 12.8757 27.9884 12.828 31.0097C12.7776 34.2028 13.1777 37.3517 13.8135 40.4736C14.3899 43.3034 15.1574 46.0779 16.2535 48.7559C16.3576 49.0103 16.4873 49.0962 16.7653 49.0956C20.232 49.0882 23.6988 49.0882 27.1656 49.0882C28.1919 49.0882 29.2182 49.0882 30.2445 49.088C30.3231 49.088 30.4017 49.0837 30.4921 49.0787C30.5382 49.0762 30.5874 49.0735 30.6413 49.0711C30.6204 49.0215 30.6018 48.976 30.5843 48.9333C30.55 48.8493 30.5201 48.7763 30.4867 48.7049C30.236 48.1687 29.9802 47.6346 29.7243 47.1006C29.1693 45.9422 28.6142 44.7838 28.1123 43.6028C26.5899 40.0211 25.424 36.3333 25.0682 32.4297C24.9112 30.7073 24.933 28.9947 25.4109 27.3164C25.9571 25.398 27.1293 24.0437 29.0727 23.4775C30.8572 22.9576 32.6666 22.961 34.4414 23.5349C36.0255 24.0472 37.0582 25.1292 37.4975 26.7492C37.8349 27.9934 37.8348 29.2511 37.5795 30.5054C37.383 31.4712 36.9873 32.3525 36.2751 33.0575C34.9977 34.322 33.4022 34.6128 31.6903 34.5159C31.3857 34.4987 31.0821 34.4653 30.7692 34.4309C30.6226 34.4148 30.474 34.3984 30.3224 34.3834C30.3267 34.4319 30.3291 34.4765 30.3314 34.5183C30.3358 34.6006 30.3397 34.6719 30.3566 34.74C30.4296 35.0332 30.4991 35.3275 30.5686 35.6218C30.7361 36.3308 30.9036 37.0399 31.1189 37.734C31.5418 39.0971 32.0335 40.4274 32.5909 41.7263C36.5645 41.4162 40.2244 40.4284 44.1089 38.0966C44.1672 38.0598 44.2202 38.0265 44.2733 37.9935C45.9418 36.9548 47.2923 35.6072 48.2236 33.8672C49.7318 31.0494 50.0257 28.036 49.5777 24.9256C49.1153 21.7157 47.6747 19.0214 45.195 16.9079C43.4752 15.4421 41.4863 14.4821 39.3279 13.8621Z"/></svg></svg>`

const FAVICON = `data:image/svg+xml,${encodeURIComponent(LOGO)}`

export function tokenPage(stale: boolean): string {
  const [heading, body] = stale
    ? [
        'This link is from an earlier run',
        'Each run of <code>panda studio</code> prints a new link. Open the latest one from your terminal.',
      ]
    : ['Open Studio from your terminal', 'Use the link <code>panda studio</code> printed. It carries the access token.']
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panda Studio</title>
<link rel="icon" href="${FAVICON}">
<style>
:root{color-scheme:light dark;--bg:#fafafa;--card:#fff;--fg:#18181b;--muted:#52525b;--line:#e4e4e7;--code:#f4f4f5}
@media (prefers-color-scheme:dark){:root{--bg:#09090b;--card:#18181b;--fg:#fafafa;--muted:#a1a1aa;--line:#27272a;--code:#27272a}}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,sans-serif}
main{max-width:28rem;padding:32px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.brand{display:flex;align-items:center;gap:10px;margin:0 0 24px;font-weight:600}
.brand svg{display:block}
h1{margin:0 0 8px;font-size:18px;font-weight:600}
p{margin:0 0 20px;color:var(--muted)}
.command{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 6px 6px 14px;border-radius:8px;background:var(--code);font-size:13px}
button{font:inherit;font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
button:hover{border-color:var(--muted)}
button:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
code{font-family:ui-monospace,monospace}
#command::before{content:'$ ';user-select:none}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
</style>
<main>
<div class="brand">${LOGO}<span>Panda Studio</span></div>
<h1>${heading}</h1>
<p>${body}</p>
<div class="command"><code id="command">panda studio</code><button type="button" id="copy">Copy</button></div>
<span id="status" class="sr-only" role="status"></span>
</main>
<script>
const copy = document.getElementById('copy')
const status = document.getElementById('status')
const show = (label, message) => {
  copy.textContent = label
  status.textContent = message
  setTimeout(() => {
    copy.textContent = 'Copy'
    status.textContent = ''
  }, 1500)
}
copy.onclick = () =>
  navigator.clipboard.writeText('panda studio').then(
    () => show('Copied', 'Copied to clipboard'),
    () => {
      getSelection().selectAllChildren(document.getElementById('command'))
      show('Selected', 'Copy failed. The command is selected, copy it with your keyboard.')
    },
  )
</script>
</html>`
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
