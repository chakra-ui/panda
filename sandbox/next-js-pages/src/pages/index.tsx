import { useRef } from 'react'
import { styled } from '../../styled-system/jsx'
import { stack } from '../../styled-system/patterns'
import * as Custom from '../components/custom'

const Root = styled(Custom.Root, {
  base: {
    color: 'pink',
  },
})

export default function Home() {
  const ref = useRef<HTMLDivElement | null>(null)
  return (
    <div className={stack({ fontSize: '2xl', fontWeight: 'bold', padding: '4' })}>
      <Root ref={ref}>
        <Custom.Label>Hello</Custom.Label>
      </Root>
    </div>
  )
}
