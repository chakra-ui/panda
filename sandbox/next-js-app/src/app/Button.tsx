import { css, cva } from '../../styled-system/css'
import { flex } from '../../styled-system/patterns'
import { SystemStyleObject } from '../../styled-system/types'

const flexProps = flex.raw({ direction: 'row', _hover: { color: 'blue.400' }, border: '1px solid' })

export function Button(props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }) {
  const rootStyle = css(flexProps, props.css ?? {})
  return <button className={rootStyle}>{props.children}</button>
}

const thing = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' },
    },
  },
})

export const Thingy = (props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }) => {
  const rootStyle = css(thing.raw({ variant: 'primary' }), { _hover: { color: 'blue.400' } }, props.css ?? {})
  return <button className={rootStyle}>{props.children}</button>
}
