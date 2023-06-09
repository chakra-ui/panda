import { HTMLPandaProps, panda } from '../../styled-system/jsx'

export function TokenContent(props: HTMLPandaProps<'div'>) {
  return <panda.div display="flex" flexDir="column" gap="12" {...props} />
}
