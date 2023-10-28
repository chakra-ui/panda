import { BiLinkAlt } from 'react-icons/bi'

import { useShare } from '../hooks/use-share'
import { Button } from './button'

export const ShareButton = () => {
  const { copy } = useShare()
  return (
    <Button
      onClick={copy}
      size='sm'
      colorPalette='teal'
      css={{ colorPalette: 'teal' }}
      leftIcon={<BiLinkAlt />}
    >
      Share
    </Button>
  )
}
