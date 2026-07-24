const { withPandaCss } = require('@pandacss/webpack/next')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withPandaCss(nextConfig, { transform: true })
