import { css, cx } from '@/styled-system/css'

export function Steps(props: React.ComponentProps<'div'>) {
  const { children, className, ...rest } = props
  return (
    <div
      className={cx(
        'docs-steps',
        css({
          ml: 4,
          mb: 12,
          borderLeft: '1px solid token(colors.gray.200)',
          pl: 6,
          _dark: {
            borderColor: 'neutral.800'
          },
          counterReset: 'step'
        }),
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
