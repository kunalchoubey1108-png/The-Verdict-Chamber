/** @type {import('next').NextConfig} */
const nextConfig = {
  // Legacy NiveshOS vanilla engine boots once — avoid double-invoke in dev
  reactStrictMode: false,

  // AI SDK streaming requires these packages to run server-side only
  serverExternalPackages: ["@ai-sdk/google"],

  // Pass API key names through to server components (values read from .env.local)
  env: {
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
  },
};

export default nextConfig;
