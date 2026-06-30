export default {
  designSystem: '@sandbox/ds',
  include: ['src/**/*.tsx'],
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#e11d48' },
        },
      },
    },
  },
}
