import { Icon, Button, useClipboard } from '@chakra-ui/react'
import { useActiveCode } from '@codesandbox/sandpack-react'
import { useEffect } from 'react'
import { HiOutlineClipboardList } from 'react-icons/hi'

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
      colorScheme='teal'
      fontSize='xs'
      height='24px'
      right='5'
      bottom='5'
      iconSpacing='1'
      leftIcon={<Icon as={HiOutlineClipboardList} fontSize='md' />}
      zIndex='1'
      onClick={onCopy}
      _groupHover={{ opacity: '1' }}
    >
      {hasCopied ? 'Copied!' : 'Copy'}
    </Button>
  )
}
