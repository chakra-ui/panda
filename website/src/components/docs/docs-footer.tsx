import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import Link from 'next/link'

/**
 * Slim by design: pagination, page actions and the tab bar's dropdown already
 * cover what the site footer offers.
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
