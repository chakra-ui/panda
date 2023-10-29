export const defaultCode = `
import { css } from 'styled-system/css';
import { center } from 'styled-system/patterns';

export const App = () => {
  return (
    <div
      className={center({
        h: 'full',
      })}
    >
      <div
        className={css({
          display: 'flex',
          flexDir: 'column',
          fontWeight: 'semibold',
          color: 'yellow.300',
          textAlign: 'center',
          textStyle: '4xl',
        })}
      >
        <span>🐼</span>
        <span>Hello from Panda</span>
      </div>
    </div>
  );
};

`.trim()

export const indexCode = `
import React from 'react'
import ReactDOM from 'react-dom'

import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
`.trim()

export const themeCode = `
import { defineConfig } from '@pandacss/dev';

export const config = defineConfig({
  theme: { extend: {} },
  globalCss: {
    html: {
      h: 'full',
    },
    body: {
      bg: { base: 'white', _dark: '#2C2C2C' },
    },
  },
  jsxFramework: 'react',
});

`.trim()

export const FILES_TO_EXCLUDE = [
  '/tsconfig.json',
  '/styles.css',
  '/public/index.html',
  '/package.json',
]
