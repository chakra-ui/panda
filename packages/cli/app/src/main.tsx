import React from 'react'
import ReactDOM from 'react-dom/client'
import '../design-system/styles.css'
import { Suspense } from 'react'
import { BrowserRouter as Router, useLocation, useRoutes } from 'react-router-dom'

import pages from '~react-pages'
import { Layout } from './components/layout'
import { globalCss } from 'design-system/css'

globalCss({
  ':root': {
    '--bg': 'colors.bg',
    '--aside-bg': '#1a1a1a',
    fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 400,

    colorScheme: 'light dark',
    color: 'rgba(255, 255, 255, 0.87)',
    background: 'var(--bg)',

    fontSynthesis: 'none',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    WebkitTextSizeAdjust: '100%',

    osLight: {
      color: '#213547',
    },
  },

  a: {
    color: 'unset',
    textDecoration: 'none',
  },

  body: {
    margin: 0,
    minW: '320px',
    minHeight: '100vh',
  },

  h1: {
    fontSize: '3.2em',
    lineHeight: '1.1',
  },
})

const App = () => {
  const routes = useRoutes(pages)
  const location = useLocation()
  const Wrapper = location.pathname === '/' ? React.Fragment : Layout
  return (
    <Wrapper>
      <Suspense fallback={<p>Loading...</p>}>{routes}</Suspense>{' '}
    </Wrapper>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
