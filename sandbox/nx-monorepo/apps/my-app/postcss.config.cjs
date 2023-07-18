module.exports = {
  plugins:
    process.env.NX_TASK_TARGET_TARGET === 'storybook'
      ? [
          require('@pandacss/dev/postcss')({
            configPath: './libs/theme/panda.config.ts',
          }),
        ]
      : {
          '@pandacss/dev/postcss': {
            configPath: '../../libs/theme/panda.config.ts',
          },
        },
};
