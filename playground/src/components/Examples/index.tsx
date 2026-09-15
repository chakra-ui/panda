import { EXAMPLES, Example } from '@/src/components/Examples/data'
import { button, menu } from '@/styled-system/recipes'
import { Menu } from '@ark-ui/react/menu'

type ExamplesProps = {
  setExample: (_example: Example) => void
}

export const Examples = (props: ExamplesProps) => {
  const classes = menu()
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
      <Menu.Positioner>
        <Menu.Content className={classes.content}>
          {EXAMPLES.map((example) => (
            <Menu.Item key={example.id} value={example.id} className={classes.item}>
              {example.label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}
