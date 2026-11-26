import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  ...(isVercel
    ? {
        basePath: "/research",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
