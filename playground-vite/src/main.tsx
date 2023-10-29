import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import 'buffer'

import App from './App'
import './index.css'
import { AppToastProvider } from './components/toast-provider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute='class' enableSystem={false} defaultTheme='dark'>
        <AppToastProvider>
          <App />
          <Toaster />
        </AppToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
