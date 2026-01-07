/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/pplepolicy",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pplepolicy",
        permanent: true,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
