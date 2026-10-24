import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This directory is the standalone app root, even when nested in the prototype repo.
  outputFileTracingRoot: projectRoot,
  // Off so dev mode does not start each jury stream (5 AI calls) twice
  reactStrictMode: false,

  // AI SDK streaming requires these packages to run server-side only
  serverExternalPackages: ["@ai-sdk/google"],

  // The PayPal JS SDK needs the client ID in the browser (it is public by design);
  // PAYPAL_CLIENT_SECRET is never exposed.
  env: { NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ?? "" },
};

export default nextConfig;
