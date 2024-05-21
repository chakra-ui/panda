import { watch } from 'chokidar'

import { main as postbuild } from './postbuild'
import { main as build } from './build'
import { join } from 'path'

const main = () => {
  build()
  return postbuild()
}

main().then(() => {
  watch(join(__dirname, '..', 'src')).on('change', () => {
    console.log('Rebuild types')
    main()
  })
})
