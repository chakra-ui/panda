'use client'
import { Box, panda } from '../styled-system/jsx'
import { DesktopNavBar } from './navbar.desktop'
import { MobileNavBar } from './navbar.mobile'

export const Navbar = () => {
  return (
    <panda.div position="absolute" top="6" width="full" zIndex="10">
      <panda.div maxW="8xl" mx="auto" px={{ base: '4', md: '6', lg: '8' }}>
        <Box display={{ base: 'none', md: 'block' }}>
          <DesktopNavBar />
        </Box>
        <Box display={{ md: 'none' }}>
          <MobileNavBar />
        </Box>
      </panda.div>
    </panda.div>
  )
}
