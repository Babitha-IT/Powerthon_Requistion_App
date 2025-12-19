/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use a custom build directory to avoid permissions issues
  distDir: 'build',
  // Disable webpack optimizations that might cause file locks
  webpack: (config, { isServer }) => {
    // Disable webpack file system caching in development
    if (!isServer) {
      config.cache = false
    }
    return config
  },
  // Disable type checking during build (can be done separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig