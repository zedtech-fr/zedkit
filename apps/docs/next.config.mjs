import { createMDX } from "fumadocs-mdx/next";

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Static export: the docs build emits the whole site to apps/docs/out,
  // ready to be served by any static host.
  output: "export",
  experimental: {
    // Smaller client chunks on home/catalog (#618): barrel imports tree-shake per module.
    optimizePackageImports: [
      "@zedtech/zedkit-ui",
      "fumadocs-ui",
      "lucide-react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
