import { createMDX } from "fumadocs-mdx/next";

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Static export: the docs build emits the whole site to apps/docs/out,
  // ready to be served by any static host.
  output: "export",
};

const withMDX = createMDX();

export default withMDX(nextConfig);
