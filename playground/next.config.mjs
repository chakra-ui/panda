import bundleAnalyzer from '@next/bundle-analyzer'
import { createRequire } from 'node:module'

const isViz = process.env.ANALYZE === 'true'

const req = createRequire(import.meta.url)

const withBundleAnalyzer = bundleAnalyzer({
  enabled: isViz,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // aliases for resolving packages in the project
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vue/compiler-sfc': '@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js',
      lightningcss: 'lightningcss-wasm',
    }

    if (!isServer) {
      // Use NormalModuleReplacementPlugin to handle node: scheme imports
      config.plugins.push(
        // Create empty module replacements for disabled modules
        new webpack.NormalModuleReplacementPlugin(/^node:fs\/promises$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:fs$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:os$/, req.resolve('os-browserify/browser')),
        new webpack.NormalModuleReplacementPlugin(/^node:path$/, req.resolve('path-browserify')),
        new webpack.NormalModuleReplacementPlugin(/^node:util$/, req.resolve('util')),
        new webpack.NormalModuleReplacementPlugin(/^node:crypto$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:buffer$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:stream$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:url$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:assert$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:events$/, (resource) => {
          resource.request = req.resolve('./empty-module.js')
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:process$/, req.resolve('process/browser')),
      )

      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js built-in modules - disable for browser
        perf_hooks: false,
        fs: false,
        // Legacy module names (keep existing)
        module: req.resolve('./module.shim.ts'),
        os: req.resolve('os-browserify/browser'),
        path: req.resolve('path-browserify'),
        util: req.resolve('util'),
        process: req.resolve('process/browser'),
        crypto: false,
        buffer: false,
        stream: false,
        url: false,
        assert: false,
        events: false,
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

export default withBundleAnalyzer(nextConfig)
