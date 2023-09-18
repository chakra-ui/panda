import { EXAMPLES, Example } from '@/src/components/Examples/data'
import { css } from '@/styled-system/css'
import { menu } from '@/styled-system/recipes'
import { Menu, MenuContent, MenuItem, MenuPositioner, MenuTrigger } from '@ark-ui/react'

type ExamplesProps = {
  setExample: (_example: Example) => void
}

export const Examples = (props: ExamplesProps) => {
  return (
    <Menu.Root
      positioning={{ placement: 'bottom-start' }}
      onSelect={({ value }) => {
        props.setExample(value as Example)
      }}
    >
      <MenuTrigger asChild>
        <button
          title="Try out some examples"
          className={css({
            borderRadius: 'lg',
            fontWeight: 'semibold',
            cursor: 'pointer',
            px: '3',
            py: '2',
            bg: { base: 'gray.100', _dark: '#3A3A3AFF' },
          })}
        >
          Examples
        </button>
      </MenuTrigger>
      <MenuPositioner className={menu()}>
        <MenuContent>
          {EXAMPLES.map((example) => (
            <MenuItem key={example.id} id={example.id}>
              {example.label}
            </MenuItem>
          ))}
        </MenuContent>
      </MenuPositioner>
    </Menu.Root>
  )
}
