import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Produces .next/standalone: a self-contained server + pruned
  // node_modules, used to package the Electron desktop build.
  output: "standalone",
};

export default nextConfig;
