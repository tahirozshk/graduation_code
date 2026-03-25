/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
    ];
  },
  /*
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://backend.profdux.com/api/:path*',
      },
    ];
  },
  */
};

export default nextConfig;
