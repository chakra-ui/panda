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
    fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
    fontSize: '14px',
    colorScheme: 'light dark',
    color: 'rgba(255, 255, 255, 0.87)',
    fontSynthesis: 'none',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    WebkitTextSizeAdjust: '100%',
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
