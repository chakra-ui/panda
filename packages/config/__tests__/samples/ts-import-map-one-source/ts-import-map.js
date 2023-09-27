import { css, cva, button, flex, card } from '@my-panda-styled-system'

const section = cva({
  base: { border: 'none' },
})

console.log('css', css({ color: 'red.100' }))
console.log('button', button({ visual: 'solid' }))
console.log('cva', section())
console.log('flex', flex({ direction: 'row' }))
console.log('card', card())
