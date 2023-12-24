import { compile } from '@/src/lib/compile-config/compile'

addEventListener('message', async (event: MessageEvent<string>) => {
  const config = await compile(event.data)

  postMessage({ config: JSON.stringify(config) })
})
