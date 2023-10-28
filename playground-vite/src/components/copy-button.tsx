import { useActiveCode } from '@codesandbox/sandpack-react'
import { useEffect } from 'react'
import { HiOutlineClipboardList } from 'react-icons/hi'
import { Button } from './button'
import { useClipboard } from '../hooks/use-clipboard'
import { Icon } from './icon'

export const CopyButton = () => {
  const { code } = useActiveCode()
  const { setValue, hasCopied, onCopy } = useClipboard(code)
  useEffect(() => {
    setValue(code)
  }, [code])

  return (
    <Button
      size='sm'
      opacity='0'
      position='absolute'
      textTransform='uppercase'
      colorPalette='teal'
      css={{ colorPalette: 'teal' }}
      fontSize='xs'
      height='24px'
      right='5'
      bottom='5'
      gap='1'
      // @ts-expect-error as prop
      leftIcon={<Icon as={HiOutlineClipboardList} fontSize='md' />}
      zIndex='1'
      onClick={onCopy}
      _groupHover={{ opacity: '1' }}
    >
      {hasCopied ? 'Copied!' : 'Copy'}
    </Button>
  )
}
