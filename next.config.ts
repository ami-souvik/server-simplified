import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	serverExternalPackages: ["ssh2"],
	output: "standalone",
};

export default nextConfig;
