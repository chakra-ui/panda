import { Stack, styled } from '../styled-system/jsx'

const Mark = styled('mark')

export function App() {
  return (
    <>
      <Stack padding="5" bg="red.200" fontFamily="Inter">
        <styled.h1 color="red.800">Vite + Preact</styled.h1>
        <Mark bg="transparent" px="3" borderWidth="1px" borderColor="red" borderRadius="md">
          Welcome
        </Mark>
      </Stack>
    </>
  )
}
