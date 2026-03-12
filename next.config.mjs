/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbopack: false,
  },
  async rewrites() {
    return [
      {
        source: "/apply",
        destination: "/external/ikingdom-intake",
      },
    ]
  },
}

export default nextConfig
