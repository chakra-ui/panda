import type { NavItemData } from '../utils/constants'
import { panda, Stack } from '../../design-system/jsx'

export function NavItem(props: NavItemData) {
  return (
    <panda.a href={`/${props.id}`}>
      <Stack
        gap="0"
        width="60"
        background="card"
        borderRadius="sm"
        padding="4"
        transition="all 0.2s ease"
        _hover={{
          boxShadow: 'lg',
        }}
      >
        <panda.span
          css={{
            '& svg': {
              fontWeight: 'normal',
              fontSize: 'xx-large',
              marginBottom: '6',
              height: '6',
              width: '6',
            },
          }}
        >
          <props.icon />
        </panda.span>
        <panda.span display="block" fontWeight="semibold" fontSize="small">
          {props.label}
        </panda.span>
        <panda.span display="block" marginTop="3">
          {props.description}
        </panda.span>
      </Stack>
    </panda.a>
  )
}
