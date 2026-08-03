import { render } from 'preact'
import { App } from './app'
import type { StudioToken, StudioView } from './helpers'
import './styles.css'

declare global {
  interface Window {
    __STUDIO__?: { views: StudioView[]; current: string; logo: string }
  }
}

const stored = localStorage.getItem('panda-studio-theme')
if (stored) document.documentElement.setAttribute('data-theme', stored)

const config = window.__STUDIO__ ?? { views: [], current: '', logo: '' }
const root = document.getElementById('root')

if (root) {
  void fetch('tokens.json')
    .then((res) => res.json())
    .then((tokens: StudioToken[]) => {
      render(<App tokens={tokens} views={config.views} current={config.current} logo={config.logo} />, root)
    })
}
