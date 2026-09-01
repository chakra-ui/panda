import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import Link from 'next/link'

/**
 * The docs shell already carries everything the site footer offers: next/prev
 * from the pagination, edit and raw-markdown from the page actions, and
 * community/project links from the tab bar's dropdown. All that is left to say
 * here is who made it, on the same gutter as the sidebar above.
 */
export const DocsFooter = () => {
  return (
    <Box
      as="footer"
      borderTopWidth="1px"
      borderColor="border"
      px={{ base: '4', md: '6' }}
      py="6"
      display="flex"
      flexWrap="wrap"
      gap="4"
      justifyContent="space-between"
      textStyle="sm"
      color="fg.subtle"
    >
      <span>Copyright © {new Date().getFullYear()}</span>
      <Link
        href="/team"
        className={css({
          color: 'inherit',
          textDecoration: 'none',
          transitionProperty: 'color',
          transitionDuration: '150ms',
          _hover: { color: 'fg' }
        })}
      >
        Proudly made by the Chakra team
      </Link>
    </Box>
  )
}
