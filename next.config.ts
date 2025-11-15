import type { NextConfig } from 'next'

// Allowed development origins for serving `/_next` static assets
// Add any local IPs or hostnames you use to access the dev server
// Example: http://192.168.0.111:3000
const nextConfig: NextConfig = {
  // In future Next versions this will be required when accessing the dev server
  // from other devices on your network.
  allowedDevOrigins: [
    'http://192.168.0.111:3000',
    'http://192.168.0.111',
    'http://192.168.0.104',
  ],
}

export default nextConfig
