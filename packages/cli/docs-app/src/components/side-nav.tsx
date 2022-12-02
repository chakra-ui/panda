import { navItems } from '../utils/constants'
import { panda, Stack } from '../../design-system/jsx'

function NavItem(props: typeof navItems[number]) {
  return (
    <a key={props.id} href={`/${props.id}`}>
      <panda.li
        paddingY="1.5"
        cursor="pointer"
        fontSize="md"
        fontWeight="semibold"
        transition="all 0.2s ease"
        // data-active={isActive ? '' : undefined}
        css={{
          '&:hover, &[data-active]': {
            color: 'blue.500',
          },
        }}
      >
        {props.label}
      </panda.li>
    </a>
  )
}

export function SideNavigation() {
  return (
    <Stack height="full" minW="60" background="card" overflow="auto" paddingX="4" paddingY="8">
      <panda.div marginTop="8">
        <panda.span fontWeight="bold" fontSize="small" opacity="0.7">
          TOKENS
        </panda.span>
        <panda.ul marginBottom="8" listStyleType="none" padding="0" marginY="2" marginX="0">
          {navItems
            .filter((k) => k.type === 'token')
            .map((themeKey) => (
              <NavItem key={themeKey.id} {...themeKey} />
            ))}
        </panda.ul>
        <panda.span fontWeight="bold" fontSize="small" opacity="0.7">
          PLAYGROUND
        </panda.span>
        <panda.ul listStyleType="none" padding="0" marginY="2" marginX="0">
          {navItems
            .filter((k) => k.type === 'playground')
            .map((themeKey) => (
              <NavItem key={themeKey.id} {...themeKey} />
            ))}
        </panda.ul>
      </panda.div>
    </Stack>
  )
}
