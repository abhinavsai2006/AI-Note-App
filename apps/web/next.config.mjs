/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	productionBrowserSourceMaps: false,
	compress: true,
	experimental: {
		optimizePackageImports: ["lucide-react", "date-fns"],
	},
	async rewrites() {
		const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

		return [
			{
				source: "/api/:path*",
				destination: `${apiBase}/:path*`,
			},
		];
	},
};

export default nextConfig;
