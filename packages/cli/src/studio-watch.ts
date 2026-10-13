import { createServer, type ServerResponse } from 'node:http'

export interface StudioWatchServer {
  url: string
  update(json: string): void
  close(): Promise<void>
}

export async function serveStudio(studioUrl: string, json: string): Promise<StudioWatchServer> {
  const clients = new Set<ServerResponse>()
  let latest = json
  const send = (res: ServerResponse) => res.write(`data: ${JSON.stringify(latest)}\n\n`)
  const page = studioPage(studioUrl)

  let host = ''
  const server = createServer((req, res) => {
    if (req.headers.host !== host) {
      res.writeHead(403).end()
      return
    }
    if (req.url === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
      clients.add(res)
      req.on('close', () => clients.delete(res))
      send(res)
      return
    }
    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(page)
      return
    }
    res.writeHead(404).end()
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as { port: number }
  host = `127.0.0.1:${port}`

  return {
    url: `http://${host}`,
    update(json) {
      latest = json
      clients.forEach(send)
    },
    close() {
      clients.forEach((res) => res.end())
      return new Promise((resolve) => server.close(() => resolve()))
    },
  }
}

function studioPage(studioUrl: string): string {
  const view = new URL('/view', studioUrl)
  return `<!doctype html>
<meta charset="utf-8">
<title>Panda Studio</title>
<style>
html,body,iframe{margin:0;width:100%;height:100%;border:0;display:block}
#status{position:fixed;inset:0 0 auto;margin:0;padding:10px 16px;font:14px system-ui,sans-serif;background:#fef3c7;color:#78350f;text-align:center}
</style>
<p id="status" role="status" hidden></p>
<iframe src="${view}"></iframe>
<script>
const frame = document.querySelector('iframe')
const status = document.getElementById('status')
const origin = ${JSON.stringify(view.origin)}
let latest
const show = (message) => {
  status.textContent = message
  status.hidden = !message
}
const push = () => latest && frame.contentWindow.postMessage({ type: 'panda-studio:spec', json: latest }, origin)
const noReply = setTimeout(() => show(${JSON.stringify(`Studio didn't pick up your design system. Check that ${view.origin} is reachable and up to date, then reload this page.`)}), 15000)
const events = new EventSource('/events')
events.onopen = () => show('')
events.onerror = () => show("panda studio --watch stopped. Studio won't update until you run it again.")
events.onmessage = (event) => {
  latest = JSON.parse(event.data)
  push()
}
addEventListener('message', (event) => {
  if (event.source !== frame.contentWindow || event.data?.type !== 'panda-studio:ready') return
  clearTimeout(noReply)
  push()
})
</script>
`
}
