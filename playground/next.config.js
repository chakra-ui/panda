const path = require('path')
const isViz = process.env.ANALYZE === 'true'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: isViz,
})

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
      lightningcss: 'lightningcss-wasm',
    }

    if (!isServer) {
      config.resolve.fallback = {
        perf_hooks: false,
      }

      config.resolve.alias = {
        ...config.resolve.alias,
        fs: path.join(__dirname, './fs.shim.ts'),
      }
      config.optimization.minimizer = []

      // config.node ||= {}
      // config.node.fs = 'empty'
      // config.node.path = 'empty'

      // config.resolve.fallback ||= {}
      // config.resolve.fallback.fs = false
      // config.resolve.fallback.path = false
    }

    config.module.rules.push({
      resourceQuery: /raw/,
      loader: 'raw-loader',
    })

    return config
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: isViz,
  },
}

module.exports = withBundleAnalyzer(nextConfig)
