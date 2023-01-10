import { Component, createSignal } from 'solid-js'
import { panda } from '../panda/jsx'

const App: Component = () => {
  const [value, setValue] = createSignal(0)
  return (
    <panda.div
      background="pink"
      paddingBlock="20px"
      fontFamily="SF Mono"
      color="black"
      class={value() === 3 ? 'red' : 'blue'}
      fontSize="20px"
      marginTop="20px"
      paddingLeft="90px"
      borderRadius="10px"
      data-value={value()}
      onClick={() => {
        setValue(value() + 1)
      }}
    >
      {value()} Edit <code>src/App.tsx</code> and save to reload.
    </panda.div>
  )
}

export default App
