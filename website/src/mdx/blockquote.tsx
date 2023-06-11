import { css } from '@/styled-system/css'

const styles = css({
  mt: { base: '6', _first: '0' },
  borderColor: { base: 'gray.300', _dark: 'gray.400' },
  fontStyle: 'italic',
  color: { base: 'gray.700', _dark: 'gray.400' },
  borderInlineStartWidth: '2',
  paddingStart: '6'
})

export function Blockquote(props: React.ComponentProps<'blockquote'>) {
  return <blockquote className={styles} {...props} />
}
