import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Suspense } from 'react'
import { BrowserRouter as Router, useLocation, useRoutes } from 'react-router-dom'

import pages from '~react-pages'
import { Layout } from './components/layout'

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
