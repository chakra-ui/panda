import { type HTMLPandaProps, panda } from '../../styled-system/jsx'

export function ColorWrapper(props: HTMLPandaProps<'div'>) {
  return (
    <panda.div
      width="full"
      height="10"
      borderRadius="sm"
      position="relative"
      overflow="hidden"
      shadow="inset"
      _before={{
        content: "''",
        position: 'absolute',
        borderRadius: 'sm',
        width: '100%',
        height: '100%',
        backgroundSize: '24px',
        zIndex: '-1',
        backgroundImage: 'check',
      }}
      {...props}
    />
  )
}
