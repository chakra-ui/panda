import { Stack, panda } from '../design-system/jsx'

export function App() {
  return (
    <>
      <Stack
        shadow="2xl"
        shadowColor="blue.200"
        direction="column"
        gap="-1"
        _hover={{ bg: 'red.200', color: 'red.200', '&:hover': { color: 'red.100' } }}
      >
        <panda.h1 color="red.100" margin="10">
          Vite + Preact
        </panda.h1>
      </Stack>
    </>
  )
}
