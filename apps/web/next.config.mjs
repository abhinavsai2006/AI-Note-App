/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	productionBrowserSourceMaps: false,
	compress: true,
	experimental: {
		optimizePackageImports: ["lucide-react", "date-fns"],
	},
};

export default nextConfig;
