import type { ComponentProps, ReactNode } from 'react'
import { css, cx } from '../../styled-system/css'
import { grid } from '../../styled-system/patterns'
import { Anchor } from './anchor'
import { HStack, panda, Stack } from '../../styled-system/jsx'

const Arrow = () => (
  <span className={css({ opacity: { base: '0', _groupHover: '1' } })}>→</span>
)

type CardProps = {
  children?: ReactNode
  title: string
  description?: string
  icon: ReactNode
  image?: boolean
  arrow?: boolean
  href: string
}

export function Card(props: CardProps) {
  const { children, title, description, icon, image, arrow, href } = props
  const animatedArrow = arrow ? <Arrow /> : null

  return (
    <panda.div borderWidth="1px" px="6" py="4" rounded="lg">
      <Anchor className="group" href={href}>
        {image || children}
        {icon}
        <span>
          <Stack gap="1">
            <panda.span textStyle="lg" fontWeight="semibold">
              <HStack>
                {title}
                {animatedArrow}
              </HStack>
            </panda.span>
            {description && (
              <panda.span color={{ base: 'neutral.700', _dark: 'neutral.400' }}>
                {description}
              </panda.span>
            )}
          </Stack>
        </span>
      </Anchor>
    </panda.div>
  )
}

export function Cards({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cx(
        grid({ columns: { base: 1, sm: 2 }, mt: '10', gap: '6' }),
        className
      )}
      {...props}
    />
  )
}
