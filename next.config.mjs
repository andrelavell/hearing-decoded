/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "date-fns",
      "clsx"
    ]
  }
};

export default nextConfig;
