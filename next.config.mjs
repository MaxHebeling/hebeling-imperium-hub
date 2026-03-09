/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
