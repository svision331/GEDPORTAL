/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./dev.db"],
  },
};
export default nextConfig;
