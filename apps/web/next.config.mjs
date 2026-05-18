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
		const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").trim();
		return {
			beforeFiles: [
				{
					source: "/api/:path*",
					destination: `${apiUrl}/:path*`,
				},
			],
		};
	},
};

export default nextConfig;
