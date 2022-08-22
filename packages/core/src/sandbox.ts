import { generator } from './generator'

generator({
  clean: true,
  hash: true,
  outdir: '__sandbox__/__generated__',
  cwd: process.cwd(),
  content: ['src/**/*.jsx'],
})
