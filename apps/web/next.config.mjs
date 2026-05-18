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
		let apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").trim();
		// Strip trailing slashes
		apiUrl = apiUrl.replace(/\/+$/, "");
		// Ensure it maps to the backend's /api prefix
		const destinationUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

		return {
			beforeFiles: [
				{
					source: "/api/:path*",
					destination: `${destinationUrl}/:path*`,
				},
			],
		};
	},
};

export default nextConfig;
