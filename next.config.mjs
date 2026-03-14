/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["lucide-react", "recharts"]
  },
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "http",
        hostname: "**"
      }
    ]
  }
}

export default nextConfig
