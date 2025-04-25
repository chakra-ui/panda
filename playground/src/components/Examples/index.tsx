import { EXAMPLES, Example } from '@/src/components/Examples/data'
import { button, menu } from '@/styled-system/recipes'
import { Menu } from '@ark-ui/react/menu'

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
      <Menu.Trigger asChild>
        <button title="Try out some examples" className={button()}>
          Examples
        </button>
      </Menu.Trigger>
      <Menu.Positioner className={menu()}>
        <Menu.Content>
          {EXAMPLES.map((example) => (
            <Menu.Item key={example.id} value={example.id}>
              {example.label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}
