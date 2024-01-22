import { defineKeyframes } from '@pandacss/dev'
import { css } from '../styled-system/css'
import { HStack, panda } from '../styled-system/jsx'
import { stack } from '../styled-system/patterns'
import { token } from '../styled-system/tokens'

const keyframes = defineKeyframes({
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
})

console.log('keyframes', keyframes)

const LocalFactoryComp = panda('button')

function App() {
  const className = css({
    bg: 'red.100',
    debug: true,
    color: '{colors.red.400}',
    fontSize: 'token(fontSizes.2xl, 4px)',
    marginInline: '{spacings.4} token(spacing.600)',
    paddingTop: token('sizes.4'),
  })
  const color = 'red'

  return (
    <div
      className={stack({
        debug: true,
        padding: '40px',
        align: 'stretch',
        bg: 'red.300',
        color: '#111',
        backgroundColor: color,
        content: "['escape hatch']",
      })}
    >
      <HStack gap="40px" debug>
        <div className={className}>Element 1</div>
        <panda.div color={color} fontWeight="bold" fontSize="50px" bg="red.200" borderTopColor={'#111'}>
          Element 2
        </panda.div>
      </HStack>
      {/* Not considered for now */}
      <LocalFactoryComp debug />
    </div>
  )
}

export default App
