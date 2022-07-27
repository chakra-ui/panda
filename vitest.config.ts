import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@css-panda\/(.*)$/,
        replacement: path.resolve('./packages/$1/src'),
      },
    ],
  },
});
