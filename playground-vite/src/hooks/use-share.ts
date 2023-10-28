import { css } from '../../styled-system/css'
import { token } from '../../styled-system/tokens'
import { useUrlSync } from '../hooks/use-url-sync'
import toast from 'react-hot-toast'

const className = css({
  display: 'flex',
  position: 'relative',
  overflow: 'hidden',
  background: 'green.500!',
  paddingInlineStart: 4,
  paddingInlineEnd: 8,
  paddingTop: 3,
  paddingBottom: 3,
  color: 'white!',
  alignItems: 'start',
  borderRadius: 'md',
  boxShadow: 'lg',
  textAlign: 'start',
  width: 'auto',
  fontWeight: 'bold',
})

export const useShare = () => {
  const { codeUrl } = useUrlSync()

  const handleCopy = () => {
    navigator.clipboard.writeText(codeUrl)
    toast.success('Share link copied to clipboard', {
      position: 'bottom-right',
      className,
      iconTheme: {
        primary: 'white',
        secondary: token('colors.green.500'),
      },
    })
  }

  return {
    copy: handleCopy,
  }
}
