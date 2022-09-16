import { Component, createSignal } from 'solid-js'
import { panda } from '../panda/jsx'

const App: Component = () => {
  const [value, setValue] = createSignal(0)
  return (
    <panda.div
      background="pink"
      paddingBlock="20px"
      fontFamily="SF Mono"
      color="red"
      class={value() === 3 ? 'red' : 'blue'}
      fontSize="20px"
      marginTop="90px"
      paddingLeft="90px"
      data-value={value()}
      onClick={() => {
        setValue(value() + 1)
      }}
      css={{
        selectors: {
          '&.red': {
            fontWeight: 'bold',
          },
          '&:hover': {
            color: 'yellow',
          },
        },
      }}
    >
      <p>
        {value()} Edit <code>src/App.tsx</code> and save to reload.
      </p>
    </panda.div>
  )
}

export default App
