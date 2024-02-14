import { createPages } from 'waku'
import { HomePage } from './templates/home-page.js'
import { RootLayout } from './templates/root-layout.js'

export default createPages(async ({ createPage, createLayout }) => {
  createLayout({
    render: 'static',
    path: '/',
    // @ts-ignore
    component: RootLayout,
  })

  createPage({
    render: 'static',
    path: '/',
    // @ts-ignore
    component: HomePage,
  })
})
