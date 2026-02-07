import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "public.wru.wales",
        pathname: "/organisation/logos/**",
      },
    ],
  },
};

export default nextConfig;
