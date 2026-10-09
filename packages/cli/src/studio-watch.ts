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

  const server = createServer((req, res) => {
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

  return {
    url: `http://127.0.0.1:${port}`,
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
<style>html,body,iframe{margin:0;width:100%;height:100%;border:0;display:block}</style>
<iframe src="${view}"></iframe>
<script>
const frame = document.querySelector('iframe')
const origin = ${JSON.stringify(view.origin)}
let latest
const push = () => latest && frame.contentWindow.postMessage({ type: 'panda-studio:spec', json: latest }, origin)
new EventSource('/events').onmessage = (event) => {
  latest = JSON.parse(event.data)
  push()
}
addEventListener('message', (event) => {
  if (event.source === frame.contentWindow && event.data?.type === 'panda-studio:ready') push()
})
</script>
`
}
