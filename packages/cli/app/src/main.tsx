import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Suspense } from 'react'
import { BrowserRouter as Router, useRoutes } from 'react-router-dom'

import routes from '~react-pages'
import { Layout } from './components/layout'

const App = () => {
  return <Suspense fallback={<p>Loading...</p>}>{useRoutes(routes)}</Suspense>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <Layout>
        <App />
      </Layout>
    </Router>
  </React.StrictMode>,
)
