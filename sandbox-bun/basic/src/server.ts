import index from './index.html'

const server = Bun.serve({
  routes: { '/': index },
  development: process.env.NODE_ENV !== 'production',
})

console.log(`Listening on ${server.url}`)
