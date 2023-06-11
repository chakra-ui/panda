'use client'
import { Box, Container, panda } from '@/styled-system/jsx'
import { DesktopNavBar } from './navbar.desktop'
import { MobileNavBar } from './navbar.mobile'

export const Navbar = () => {
  return (
    <panda.div position="absolute" top="6" width="full" zIndex="10">
      <Container>
        <Box display={{ base: 'none', md: 'block' }}>
          <DesktopNavBar />
        </Box>
        <Box display={{ md: 'none' }}>
          <MobileNavBar />
        </Box>
      </Container>
    </panda.div>
  )
}
