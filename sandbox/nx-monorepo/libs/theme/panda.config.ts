import {
  defineConfig,
  defineRecipe,
  defineSemanticTokens,
} from '@pandacss/dev';

import { tokens } from './src/tokens';

export default defineConfig({
  preflight: true,
  jsxFramework: 'react',
  outExtension: 'js',
  // clean: true,
  include:
    process.env.NX_TASK_TARGET_TARGET === 'storybook'
      ? ['./apps/**/*.{ts,tsx}', './libs/**/*.{ts,tsx}']
      : ['../../apps/**/*.{ts,tsx}', '../../libs/**/*.{ts,tsx}'],
  outdir:
    process.env.NX_TASK_TARGET_TARGET === 'storybook'
      ? './libs/theme/src/__generated__'
      : '../../libs/theme/src/__generated__',
  theme: {
    extend: {
      tokens,
      semanticTokens: defineSemanticTokens({
        colors: {
          heavy: { value: '{colors.blue}' },
          light: { value: '{colors.red}' },
        },
      }),
      recipes: {
        heading: defineRecipe({
          name: 'heading',
          base: {},
          variants: {
            size: {
              large: { fontSize: '2xl' },
              small: { fontSize: 'xl' },
            },
          },
        }),
      },
    },
  },
});
