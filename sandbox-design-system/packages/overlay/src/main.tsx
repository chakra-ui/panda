import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './index.css'

createRoot(document.querySelector<HTMLDivElement>('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
