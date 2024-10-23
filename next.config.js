/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	swcMinify: true,
	images: {
		domains: ["avatars.githubusercontent.com", "i.imgur.com"],
	},
	output: "standalone",
};

module.exports = nextConfig;
