import { cva, cx } from '@/styled-system/css'

const styles = cva({
  base: {
    transition: 'opacity',
    position: 'absolute',
    my: '1.5',
    userSelect: 'none',
    insetEnd: '1.5',
    height: '5',
    rounded: 'sm',
    bg: { base: 'white', _dark: 'rgb(17 17 17 / 0.2)' },
    color: 'gray.500',
    px: '1.5',
    fontFamily: 'mono',
    fontSize: '10px',
    fontWeight: 'medium',
    borderWidth: '1px',
    alignItems: 'center',
    left: '1.5'
  },
  variants: {
    mounted: {
      true: { opacity: '1' },
      false: { opacity: '0' }
    },
    hasValue: {
      true: {
        display: 'flex',
        gap: '1',
        zIndex: '20',
        cursor: 'pointer',
        _hover: { opacity: 0.7 }
      },
      false: {
        pointerEvents: 'none',
        display: { base: 'none', sm: 'flex' }
      }
    }
  }
})

type Props = {
  value?: string
  mounted?: boolean
}

export const Kbd = (props: React.ComponentProps<'kbd'> & Props) => {
  const { value, mounted, className, ...rest } = props
  return (
    <kbd
      className={cx(
        styles({ mounted: !!mounted, hasValue: !!value }),
        className
      )}
      {...rest}
    />
  )
}
