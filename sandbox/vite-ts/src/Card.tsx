import { panda, AbsoluteCenter } from '../design-system/jsx'
import { container, stack } from '../design-system/patterns'
import { SystemStyleObject } from '../design-system/types'

export const tt: SystemStyleObject = {
  marginTop: '-12',
  padding: '60',
  color: 'blue.200',
  margin: '-11',
  outlineColor: 'red.100',
  '&[data-checked]': {
    color: 'red.200',
    backdropFilter: 'auto',
  },
  fontSize: '3xl',
  _hover: {
    bg: 'red.200',
    fontSize: '3xl',
  },
  '&[data-empty]': {
    fontSize: '3xl',
  },
}

export function Card() {
  return (
    <panda.div
      marginTop="56"
      padding="10"
      margin="96px"
      backdropFilter="auto"
      _focus={{
        bg: 'red.200',
      }}
      _hover={{
        marginTop: '10',
        mb: '4',
        '&[data-empty]': {
          color: 'red.200',
          fontSize: '3xl',
          '--test': 50,
        },
      }}
      css={{
        padding: '-12',
        fontSize: '3xl',
      }}
    >
      <AbsoluteCenter color="red.200" margin="-11" axis="y" padding="4" _hover={{ bg: 'red.100' }} />
      <div className={stack({ gap: '40', direction: 'column', align: 'center' })} />
      <span className={container({ centerContent: true })}>Welcome</span>
    </panda.div>
  )
}
