export default {
  polyfill: true,
  preflight: false,
  include: ['./src/**/*.js'],
  outdir: 'styled-system',
  importMap: { css: ['@panda/css'] },
}
