import { Callout } from '@/mdx/callout'
import { Card, Cards } from '@/mdx/cards'
import { Code } from '@/mdx/code'
import { CodeBlock } from '@/mdx/code-block'
import { Details, Faq } from '@/mdx/details'
import { Divider } from '@/mdx/divider'
import {
  FileTreeFile,
  FileTreeFolder,
  FileTreeRoot
} from '@/mdx/file-tree'
import { FrameworkCards } from '@/mdx/framework-card'
import { createHeadings } from '@/mdx/heading'
import { Link } from '@/mdx/link'
import { ListItem, OrderedList, UnorderedList } from '@/mdx/list'
import { Pre } from '@/mdx/pre'
import {
  RouteSwitch,
  RouteSwitchContent,
  RouteSwitchTrigger
} from '@/mdx/route-switch'
import { Steps } from '@/mdx/steps'
import { Table, Td, Th, Tr } from '@/mdx/table'
import { Tab, Tabs } from '@/mdx/tabs'
import { Text } from '@/mdx/text'
import { TokenDocs } from '@/mdx/token-docs'
import { UtilityTable } from '@/mdx/utility-table'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import type { MDXComponents } from 'mdx/types'
import * as React from 'react'

const headings = createHeadings({ index: 0 })

// A client component reference can't carry `.Folder`/`.File` across the
// server boundary, so the compound shape is rebuilt here.
const FileTree = Object.assign(
  (props: React.ComponentProps<typeof FileTreeRoot>) => (
    <FileTreeRoot {...props} />
  ),
  { Folder: FileTreeFolder, File: FileTreeFile }
)

export const mdxComponents: MDXComponents = {
  Box,
  Flex,

  a: Link,
  blockquote: Callout,
  img: (props: any) => (
    <img
      alt=""
      {...props}
      className={css({
        maxW: 'full',
        h: 'auto',
        rounded: 'md',
        my: 6
      })}
    />
  ),
  p: Text,

  ...headings,

  pre: Pre,
  code: Code,

  ol: OrderedList,
  ul: UnorderedList,
  li: ListItem,

  table: Table,
  tr: Tr,
  th: Th,
  td: Td,

  details: Details,
  Details,
  Faq,
  UtilityTable,
  hr: Divider,

  Callout,
  Card,
  Cards,
  'card-group': Cards,
  'code-block': CodeBlock,
  FileTree,
  Steps,
  TokenDocs,
  RouteSwitch: (props: any) => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <RouteSwitch {...props} />
    </React.Suspense>
  ),
  RouteSwitchTrigger,
  RouteSwitchContent,
  FrameworkCards,
  Tabs,
  Tab,

  Video: (props: any) => (
    <video
      muted
      loop
      playsInline
      autoPlay
      {...props}
      className={css({
        my: 3,
        rounded: 'lg',
        bg: 'gray.100',
        _dark: { bg: 'gray.800' }
      })}
    />
  )
}
