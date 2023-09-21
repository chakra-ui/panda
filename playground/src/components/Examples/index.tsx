import { EXAMPLES, Example } from '@/src/components/Examples/data'
import { button, menu } from '@/styled-system/recipes'
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
        <button title="Try out some examples" className={button()}>
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
