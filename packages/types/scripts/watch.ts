import { subscribe } from '@parcel/watcher'
import { join } from 'path'
import { main as build } from './build'

const rebuild = () => {
  build()
  console.log('Rebuild types')
}

rebuild()

void subscribe(join(__dirname, '..', 'src'), (error, events) => {
  if (error) throw error
  if (events.some((event) => event.type === 'update')) rebuild()
})
