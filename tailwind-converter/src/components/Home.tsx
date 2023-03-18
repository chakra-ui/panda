import { Flex } from '../../design-system/jsx'
import PlaygroundWithMachine from './Playground/PlaygroundWithMachine'

import '../styles.css'

export const Home = () => {
  return (
    <Flex w="100%" direction="column" padding="3" height="100vh">
      <PlaygroundWithMachine />;
    </Flex>
  )
}
