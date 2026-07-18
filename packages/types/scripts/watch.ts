import { watch } from 'chokidar'
import { join } from 'path'
import { main as build } from './build'

const rebuild = () => {
  build()
  console.log('Rebuild types')
}

rebuild()

watch(join(__dirname, '..', 'src')).on('change', rebuild)
