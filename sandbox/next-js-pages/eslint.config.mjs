import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: ['.next/**', 'styled-system/**', 'next-env.d.ts'],
  },
  ...nextVitals,
]

export default eslintConfig
