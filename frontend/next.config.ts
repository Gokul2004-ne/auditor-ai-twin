import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? '/auditor-ai-twin' : ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath,
  assetPrefix: isProd ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
