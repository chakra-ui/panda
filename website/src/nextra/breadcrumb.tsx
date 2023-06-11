import { css } from '@/styled-system/css'
import type { Item } from 'nextra/normalize-pages'

const styles = css({
  fontWeight: 'semibold',
  color: 'blue.500',
  mb: '6'
})

type Props = {
  activePath: Item[]
}

export const Breadcrumb = ({ activePath }: Props) => {
  const currentPath = activePath[1]
  return <p className={styles}>{currentPath.title}</p>
}
