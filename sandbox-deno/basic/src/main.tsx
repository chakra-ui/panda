import { renderToString } from 'react-dom/server'
import { App } from './App.tsx'

function html(): string {
  const markup = renderToString(<App />)
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Panda Deno React Hello World</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>${markup}</body>
</html>`
}

Deno.serve({ port: 4507 }, async (request: Request): Promise<Response> => {
  const url = new URL(request.url)
  if (url.pathname === '/styles.css') {
    const css = await Deno.readTextFile(new URL('../styled-system/styles.css', import.meta.url))
    return new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8' } })
  }

  return new Response(html(), { headers: { 'content-type': 'text/html; charset=utf-8' } })
})
