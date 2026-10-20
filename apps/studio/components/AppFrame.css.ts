import { css } from 'styled-system/css'

export const frame = css({
  display: 'grid',
  gridTemplateColumns: { base: 'minmax(0,1fr)', md: '264px minmax(0,1fr)' },
  gridTemplateRows: { base: 'auto 1fr', md: '1fr' },
  minH: '100dvh',
  h: { md: '100dvh' },
  overflow: { md: 'hidden' },
  bg: 'sunken',
})

export const mobileBar = css({
  display: { base: 'flex', md: 'none' },
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: '0',
  zIndex: '20',
  h: '52px',
  px: '3',
  bg: 'sunken',
})

export const menuButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  h: '8',
  px: '2.5',
  rounded: 'lg',
  fontSize: '13px',
  fontWeight: '500',
  color: 'ink',
  cursor: 'pointer',
  _hover: { bg: 'selected' },
  _focusVisible: { outline: 'none', boxShadow: 'focusHalo' },
})

export const backdrop = css({
  display: { base: 'block', md: 'none' },
  position: 'fixed',
  inset: '0',
  zIndex: '50',
  bg: 'rgba(0,0,0,0.24)',
  animation: 'fadeIn 0.2s ease-out',
  _dark: { bg: 'rgba(0,0,0,0.6)' },
})

export const sidebar = css({
  display: 'flex',
  flexDir: 'column',
  gap: '4',
  minW: '0',
  minH: '0',
  p: '4',
  bg: 'sunken',
  position: { base: 'fixed', md: 'static' },
  insetInline: { base: '0', md: 'auto' },
  bottom: { base: '0', md: 'auto' },
  zIndex: { base: '60', md: 'auto' },
  maxH: { base: '85dvh', md: 'none' },
  pt: { base: '2', md: '4' },
  roundedTop: { base: '2xl', md: 'none' },
  boxShadow: { base: 'overlay', md: 'none' },
  transform: { base: 'translateY(100%)', md: 'none' },
  visibility: { base: 'hidden', md: 'visible' },
  transition: { base: 'transform 0.25s ease, visibility 0.25s', md: 'none' },
  '&[data-open]': { transform: 'none', visibility: 'visible' },
  _motionReduce: { transition: 'none' },
})

export const handle = css({
  display: { base: 'block', md: 'none' },
  alignSelf: 'center',
  w: '10',
  h: '1',
  flexShrink: 0,
  rounded: 'full',
  bg: 'lineStrong',
})

export const sidebarTop = css({ display: 'flex', alignItems: 'center', gap: '2' })

export const live = css({ ml: 'auto' })

export const closeButton = css({
  display: { base: 'grid', md: 'none' },
  ml: 'auto',
  mr: '-2',
  placeItems: 'center',
  w: '8',
  h: '8',
  rounded: 'lg',
  color: 'muted',
  cursor: 'pointer',
  _hover: { bg: 'selected', color: 'ink' },
  _focusVisible: { outline: 'none', boxShadow: 'focusHalo' },
})

export const brand = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  h: '8',
  fontSize: '14px',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  rounded: 'md',
  _focusVisible: { outline: '2px solid', outlineColor: 'ring', outlineOffset: '2px' },
})

export const sidebarHeader = css({ display: 'flex', flexDir: 'column', gap: '3' })

export const sidebarBody = css({
  position: 'relative',
  display: 'flex',
  flexDir: 'column',
  gap: '5',
  flex: '1',
  minH: '0',
  overflowY: 'auto',
  // Room inside the scroll box so ring shadows and focus halos aren't clipped.
  m: '-1',
  p: '1',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
  '--fade': '24px',
  '&[data-fade-bottom]': { maskImage: 'linear-gradient(to bottom, #000 calc(100% - var(--fade)), transparent)' },
  '&[data-fade-top]': { maskImage: 'linear-gradient(to top, #000 calc(100% - var(--fade)), transparent)' },
  '&[data-fade-top][data-fade-bottom]': {
    maskImage: 'linear-gradient(to bottom, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent)',
  },
})

export const sidebarFoot = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
})

export const docsLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  h: '7',
  px: '1',
  rounded: 'md',
  fontSize: '13px',
  fontWeight: '500',
  color: 'muted',
  transition: 'color 0.15s',
  _hover: { color: 'ink' },
  _focusVisible: { outline: 'none', boxShadow: 'focusHalo' },
})

export const panel = css({
  position: 'relative',
  minW: '0',
  m: { base: '0', md: '1' },
  mx: { md: '0' },
  bg: 'canvas',
  roundedTop: '2xl',
  roundedBottom: { base: '0', md: '2xl' },
  roundedRight: { md: '0' },
  boxShadow: 'raised',
  overflowY: { md: 'auto' },
  scrollbarGutter: 'stable',
})

export const topbar = css({
  position: 'sticky',
  top: '0',
  zIndex: '10',
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  h: '14',
  px: { base: '4', md: '5' },
  bg: 'color-mix(in srgb, token(colors.canvas) 88%, transparent)',
  backdropFilter: 'blur(8px)',
})

export const header = css({})

export const content = css({
  mx: 'auto',
  px: { base: '4', md: '10' },
  maxW: 'calc(720px + 5rem)',
  '&[data-width=wide]': { maxW: 'calc(880px + 5rem)' },
})

export const headerContent = css({
  pt: { base: '8', md: '16' },
  pb: '2',
  '[data-topbar] &': { pt: { base: '4', md: '8' } },
})

export const bodyContent = css({ pt: { base: '6', md: '10' }, pb: { base: '10', md: '20' } })
