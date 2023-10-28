import { Button } from '@chakra-ui/react'
import { BiLinkAlt } from 'react-icons/bi'

import { useShare } from '../hooks/use-share'

export const ShareButton = () => {
  const { copy } = useShare()
  return (
    <Button
      onClick={copy}
      size='sm'
      colorScheme='teal'
      leftIcon={<BiLinkAlt />}
    >
      Share
    </Button>
  )
}
