import { css } from 'styled-system/css'
import { Box, styled } from 'styled-system/jsx'
import { stack } from 'styled-system/patterns'
import { btn } from 'styled-system/recipes'
import { token } from 'styled-system/tokens'

const Notice = styled('div', {
  base: {
    bg: 'red',
    color: 'white',
    padding: '2',
    borderRadius: 'md',
    outline: `2px solid ${token('colors.colorPalette.500')}`,
    fontWeight: 'bold',
  },
  variants: {
    size: {
      lg: {
        fontSize: token('fontSizes.3xl'),
        '&:hover': {
          fontSize: token('fontSizes.4xl'),
        },
      },
    },
  },
})

export const App = () => {
  return (
    <Box p="4" spaceY="4" colorPalette="blue" bg={token('colors.colorPalette.500')}>
      <Notice>Styled</Notice>
      <Notice unstyled bg="pink" color="green">
        Unstyled + css
      </Notice>
      <Notice size="lg">Styled + variants (font-size: 3xl)</Notice>
      <div className={stack()}>
        <a className={css({ mb: '3', paddingEnd: '2' })}>Click me</a>
      </div>
      <div className={css({ color: 'yellow' })}></div>
      <div className={btn()}>aaaa Click me</div>
    </Box>
  )
}
