const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // aliases for resolving packages in the project
    config.resolve.alias = {
      ...config.resolve.alias,
      process: 'process/browser',
      os: 'os-browserify',
      path: 'path-browserify',
      util: 'util',
      module: path.join(__dirname, './module.shim.ts'),
      '@vue/compiler-sfc': '@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js',
    }

    if (!isServer) {
      config.resolve.fallback = {
        perf_hooks: false,
      }
    }

    return config
  },
  reactStrictMode: true,
}

module.exports = nextConfig
