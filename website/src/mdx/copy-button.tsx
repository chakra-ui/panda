'use client'

import { CheckIcon, CopyIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { useRef, useState } from 'react'

export const CopyButton = () => {
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const pre = ref.current?.parentElement?.querySelector('pre')
    if (!pre) return
    try {
      await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ''))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={css({
        position: 'absolute',
        top: '2',
        insetInlineEnd: '2',
        zIndex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSize: '8',
        rounded: 'md',
        borderWidth: '1px',
        borderColor: 'border',
        bg: 'bg',
        color: 'fg.muted',
        cursor: 'pointer',
        opacity: '0.7',
        transitionProperty: 'opacity, color',
        transitionDuration: '150ms',
        _hover: { opacity: '1', color: 'fg' },
        _focusVisible: { opacity: '1' },
        '& svg': { boxSize: '4' }
      })}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}
