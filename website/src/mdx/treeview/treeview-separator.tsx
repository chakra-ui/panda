import { renderComponent } from '@/lib/render'
import { useConfig } from '@/mdx/contexts'
import { panda } from '@/styled-system/jsx'
import { FC } from 'react'

/* -----------------------------------------------------------------------------
 * TreeView Separator Container
 * -----------------------------------------------------------------------------*/

const TreeViewSeparatorContainer = panda('li', {
  base: {
    wordBreak: 'break-word'
  },
  variants: {
    withTitle: {
      true: {
        mt: 5,
        mb: 2,
        px: 2,
        py: 1.5,
        textStyle: 'sm',
        fontWeight: 'semibold',
        color: 'gray.900',
        _first: {
          mt: 0
        },
        _dark: {
          color: 'gray.100'
        }
      },
      false: {
        my: 4
      }
    }
  }
})

/* -----------------------------------------------------------------------------
 * TreeView Separator Hr
 * -----------------------------------------------------------------------------*/

const TreeViewSeparatorHr = () => (
  <panda.hr
    mx={2}
    borderTopWidth="1px"
    borderTopColor="gray.200"
    _dark={{
      borderTopColor: 'whiteAlpha.200'
    }}
  />
)

/* -----------------------------------------------------------------------------
 * TreeView Separator
 * -----------------------------------------------------------------------------*/

export interface ITreeViewSeparator {
  title: string
}

export const TreeViewSeparator: FC<ITreeViewSeparator> = ({ title }) => {
  const config = useConfig()

  return (
    <TreeViewSeparatorContainer withTitle={Boolean(title)}>
      {title ? (
        renderComponent(config.sidebar.titleComponent, {
          title,
          type: 'separator',
          route: ''
        })
      ) : (
        <TreeViewSeparatorHr />
      )}
    </TreeViewSeparatorContainer>
  )
}
