import { panda } from '../../design-system/jsx'
import type { NavItemData } from '../utils/constants'

export function NavItem(props: NavItemData) {
  return (
    <panda.a href={`/${props.id}`}>
      <panda.div
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
      </panda.div>
    </panda.a>
  )
}
