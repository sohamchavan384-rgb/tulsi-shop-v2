/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Disable Webpack filesystem caching in development on Termux
    if (dev) {
      config.cache = false
    }
    config.watchOptions = {
      ignored: ['**/node_modules', '**/.git'],
    }
    return config
  },
}

module.exports = nextConfig
