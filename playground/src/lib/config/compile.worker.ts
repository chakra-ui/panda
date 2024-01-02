import { compile } from './compile'

addEventListener('message', async (event: MessageEvent<string>) => {
  try {
    const config = await compile(event.data)
    postMessage({ config: JSON.stringify(config) })
  } catch (error) {
    postMessage({ error })
  }
})
