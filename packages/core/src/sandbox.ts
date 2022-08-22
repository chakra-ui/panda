import { generator } from './generator'

generator({
  outdir: '__sandbox__/__generated__',
  cwd: process.cwd(),
  content: ['src/**/*.jsx'],
})
