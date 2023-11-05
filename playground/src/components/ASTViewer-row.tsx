'use client'

import { JsonViewer } from '@textea/json-viewer'
import { useEffect, useState } from 'react'

// nextjs SSR throws if not doing these.. things
const ResultItemRowJson = ({
  className,
  data,
  theme,
}: {
  className: string
  theme: string | undefined
  data: any[]
}) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return mounted ? <JsonViewer className={className} theme={theme as any} value={unwrapArray(data)} /> : null
}

export default ResultItemRowJson

function unwrapArray<T>(array: T[]): T | T[] {
  if (array.length === 1) {
    return array[0]!
  }

  return array
}
