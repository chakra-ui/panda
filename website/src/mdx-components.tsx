import type { Components } from 'nextra/mdx'
import type { DocsThemeConfig } from './constants'
import { Blockquote } from './mdx/blockquote'
import { Code } from './mdx/code'
import { Details } from './mdx/details'
import { Divider } from './mdx/divider'
import { createHeadings } from './mdx/heading'
import { A, Link } from './mdx/link'
import { ListItem, OrderedList, UnorderedList } from './mdx/list'
import { Pre } from './mdx/pre'
import { Summary } from './mdx/summary'
import { Table, Td, Th, Tr } from './mdx/table'
import { Text } from './mdx/text'
import {
  RouteSwitch,
  RouteSwitchContent,
  RouteSwitchTrigger
} from './mdx/route-switch'

type Props = {
  isRawLayout?: boolean
  components?: DocsThemeConfig['components']
}

export const getComponents = (props: Props): Components => {
  const { isRawLayout, components } = props

  if (isRawLayout) {
    return { a: A }
  }

  const headings = createHeadings({ index: 0 })

  return {
    ...headings,
    ul: UnorderedList,
    ol: OrderedList,
    li: ListItem,
    blockquote: Blockquote,
    hr: Divider,
    a: Link,
    table: Table,
    p: Text,
    tr: Tr,
    th: Th,
    td: Td,
    details: Details,
    summary: Summary,
    pre: Pre,
    code: Code,
    RouteSwitch: RouteSwitch,
    RouteSwitchTrigger: RouteSwitchTrigger,
    RouteSwitchContent: RouteSwitchContent,
    ...components
  }
}
