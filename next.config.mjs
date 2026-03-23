/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/awsops',
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
