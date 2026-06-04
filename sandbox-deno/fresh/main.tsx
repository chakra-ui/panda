import { App, staticFiles } from 'fresh'

export const app = new App().use(staticFiles()).fsRoutes()

if (import.meta.main) {
  app.listen()
}
