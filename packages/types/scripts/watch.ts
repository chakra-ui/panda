import { watch } from 'chokidar'

import { main } from './postbuild'
import { join } from 'path'

main().then(() => {
  watch(join(__dirname, '..', 'src')).on('change', () => {
    console.log('Rebuild types')
    main()
  })
})
