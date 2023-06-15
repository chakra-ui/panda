import { css } from '@/styled-system/css'
import type { Item } from 'nextra/normalize-pages'

const styles = css({
  fontWeight: 'medium',
  color: 'black',
  bg: 'yellow.100',
  border: '1px solid token(colors.yellow.200)',
  mb: '6',
  display: 'inline-block',
  rounded: 'md',
  px: 2,
  _dark: {
    bg: 'yellow.200',
    border: '1px solid token(colors.yellow.300)',
  }
})

type Props = {
  activePath: Item[]
}

export const Breadcrumb = ({ activePath }: Props) => {
  const currentPath = activePath[1]
  return <p className={styles}>{currentPath.title}</p>
}
