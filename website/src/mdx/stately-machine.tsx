'use client'
import { css } from '@/styled-system/css'
import { useTheme } from 'next-themes'
import {
  FunctionComponent,
  useRef,
  useState,
  useEffect,
  RefObject
} from 'react'

const baseUrl = 'https://stately.ai/registry/editor/embed'

export const StatelyMachinePreview = ({
  embedId,
  machineId
}: {
  embedId?: string
  machineId?: string
}) => {
  const { resolvedTheme } = useTheme()
  const src = `${baseUrl}/${embedId}?mode=Simulate&machineId=${machineId}&colorMode=${resolvedTheme}`

  return (
    <GeneralObserver>
      <iframe
        loading="lazy"
        src={src}
        allowFullScreen
        className={css({
          display: 'block',
          width: '100%',
          aspectRatio: '6 / 4'
        })}
      >
        <a href={src}>
          View the <em>Embed feature machine</em> machine in Stately Studio{' '}
        </a>
      </iframe>
    </GeneralObserver>
  )
}

interface IGeneralObserverProps {
  /** React Children */
  children: React.ReactNode
  /** Fires when IntersectionObserver enters viewport */
  onEnter?: (id?: string) => void
  /** The height of the placeholder div before the component renders in */
  height?: number
}

/**
 * @see https://github.com/PaulieScanlon/mdx-embed/blob/c93115daa96291f1a23f6acdf90e8897142f6b3a/packages/mdx-embed/src/components/youtube/youtube.tsx
 */
const GeneralObserver: FunctionComponent<IGeneralObserverProps> = ({
  children,
  onEnter,
  height = 0
}) => {
  const ref = useRef<HTMLElement>(null)
  const [isChildVisible, setIsChildVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0) {
          setIsChildVisible(true)
          onEnter && onEnter()
        }
      },
      {
        root: null,
        rootMargin: '400px',
        threshold: 0
      }
    )
    if (ref && ref.current) {
      observer.observe(ref.current)
    }
  }, [ref])

  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      data-testid="general-observer"
      className="mdx-embed"
    >
      {isChildVisible ? children : <div style={{ height, width: '100%' }} />}
    </div>
  )
}
