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
      '@vue/compiler-sfc': '@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js',
      lightningcss: 'lightningcss-wasm',
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        perf_hooks: false,
        fs: false,
        module: require.resolve('./module.shim.ts'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        util: require.resolve('util'),
        process: require.resolve('process/browser'),
      }
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
