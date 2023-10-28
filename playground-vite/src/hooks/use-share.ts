import { useToast } from '@chakra-ui/react'

import { useUrlSync } from '../hooks/use-url-sync'

export const useShare = () => {
  const { codeUrl } = useUrlSync()

  const toast = useToast()

  const handleCopy = () => {
    navigator.clipboard.writeText(codeUrl)
    toast({
      title: 'Share link copied to clipboard',
      status: 'success',
      position: 'bottom-right',
    })
  }

  return {
    copy: handleCopy,
  }
}
