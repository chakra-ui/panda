'use client'

import { Callout } from '@/mdx/callout'
import { Card, Cards } from '@/mdx/cards'
import { Code } from '@/mdx/code'
import { CodeBlock } from '@/mdx/code-block'
import { Collapse } from '@/mdx/collapse'
import { Details } from '@/mdx/details'
import { Divider } from '@/mdx/divider'
import { FileTree } from '@/mdx/file-tree'
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
import { Summary } from '@/mdx/summary'
import { Table, Td, Th, Tr } from '@/mdx/table'
import { Tab, Tabs } from '@/mdx/tabs'
import { Text } from '@/mdx/text'
import { TokenDocs } from '@/mdx/token-docs'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import * as React from 'react'
import * as runtime from 'react/jsx-runtime'

// Create heading components
const headings = createHeadings({ index: 0 })

// Define shared components for MDX
const sharedComponents = {
  // Styled system components
  Box,
  Flex,

  a: Link,
  blockquote: Callout,
  img: (props: any) => (
    <img
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

  // Headings
  ...headings,

  // Code
  pre: Pre,
  code: Code,

  // Lists
  ol: OrderedList,
  ul: UnorderedList,
  li: ListItem,

  // Table
  table: Table,
  tr: Tr,
  th: Th,
  td: Td,

  // Other elements
  details: Details,
  summary: Summary,
  hr: Divider,

  // Custom components
  Callout,
  Card,
  Cards,
  'card-group': Cards,
  'code-block': CodeBlock,
  Collapse,
  FileTree,
  Steps,
  TokenDocs,
  RouteSwitch,
  RouteSwitchTrigger,
  RouteSwitchContent,
  FrameworkCards,
  Tabs,
  Tab,

  // Utility components
  Video: (props: any) => {
    return (
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
}

// Runtime MDX component compiler
const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

interface MDXContentProps {
  code: string | any // Can be string (for runtime) or component (for Velite)
  components?: Record<string, React.ComponentType>
}

export const MDXContent = (props: MDXContentProps) => {
  const { code, components = {} } = props

  // If code is a string, compile it at runtime
  if (typeof code === 'string') {
    const Component = useMDXComponent(code)
    return <Component components={{ ...sharedComponents, ...components }} />
  }

  // If code is already a component (from Velite), use it directly
  const MDXComponent = code
  if (!MDXComponent) {
    return null
  }

  return <MDXComponent components={{ ...sharedComponents, ...components }} />
}

// Export the shared components for external use
export { sharedComponents }
