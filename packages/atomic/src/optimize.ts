import css from '@parcel/css'

export type OptimizeOptions = {
  minify?: boolean
}

export function optimizeCss(code: string, options: OptimizeOptions) {
  return css.transform({
    filename: 'out.css',
    code: Buffer.from(code),
    minify: options.minify,
  })
}
