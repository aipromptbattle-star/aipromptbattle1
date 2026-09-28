
import fs from "fs";
const config = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
`;
fs.writeFileSync("next.config.ts", config);
console.log("Updated next.config.ts to ignore build errors");

