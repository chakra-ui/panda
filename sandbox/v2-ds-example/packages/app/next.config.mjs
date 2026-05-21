/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace lib + charts so Next compiles their TS source on the fly.
  transpilePackages: ['@v2-ds-example/lib', '@v2-ds-example/charts'],
}

export default nextConfig
