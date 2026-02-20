import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mastra를 외부 패키지로 설정
  serverExternalPackages: ["@mastra/*"],
}

export default nextConfig;
