import type { NextConfig } from 'next'

const isGhPages = process.env.GITHUB_PAGES === 'true'

const nextConfig: NextConfig = {
  output: isGhPages ? 'export' : undefined,
  basePath: isGhPages ? '/auditor-ai-twin' : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
