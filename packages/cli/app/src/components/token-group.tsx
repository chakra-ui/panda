import { HTMLPandaProps, panda } from '../../design-system/jsx'

export function TokenGroup(props: HTMLPandaProps<'div'>) {
  return <panda.div display="flex" flexDir="column" gap="3" width="full" marginTop="5" {...props} />
}
