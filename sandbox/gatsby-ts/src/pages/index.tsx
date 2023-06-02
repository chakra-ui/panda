import * as React from 'react'
import type { HeadFC, PageProps } from 'gatsby'
import { css } from '../../styled-system/css'

const IndexPage: React.FC<PageProps> = () => {
  return (
    <div
      className={css({
        fontSize: '40px',
        fontWeight: 'bold',
        color: 'red.800',
      })}
    >
      Hello 🐼!
    </div>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>
