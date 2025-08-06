import { stack } from '../../styled-system/patterns'
import * as Custom from '../components/custom'

export default function Home() {
  return (
    <div className={stack({ fontSize: '2xl', fontWeight: 'bold', padding: '4' })}>
      <Custom.Root>
        <Custom.Label>Hello</Custom.Label>
      </Custom.Root>
    </div>
  )
}
