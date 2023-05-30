import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"
import { css } from "../../styled-system/css"

const IndexPage: React.FC<PageProps> = () => {
  return (
    <div className={css({ fontSize: "2xl", fontWeight: 'bold' })}>Hello 🐼!</div>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>
