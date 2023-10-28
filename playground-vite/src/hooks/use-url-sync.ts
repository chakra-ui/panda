import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from 'use-debounce'
import { useActiveCode } from '@codesandbox/sandpack-react'

import { encode } from '../utils/encoder'

export function useUrlSync() {
  const [codeUrl, setCodeUrl] = useState('')
  const { code } = useActiveCode()
  const [debouncedCode] = useDebounce(code, 1000)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = encode(debouncedCode)

    if (code !== searchParams.get('code')) {
      const href = `/playground?code=${code}`
      window.history.replaceState('', '', href)
      setCodeUrl(window.location.origin + href)
    }
  }, [debouncedCode])

  return { codeUrl }
}
