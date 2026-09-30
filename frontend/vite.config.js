import { defineConfig, createLogger } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const customLogger = createLogger();
const originalLoggerError = customLogger.error;
let lastRefusalNotice = 0;

customLogger.error = (msg, options) => {
	if (options?.error?.code === "ECONNREFUSED" || msg.includes("ECONNREFUSED")) {
		const now = Date.now();
		// Throttle to log at most once every 3 seconds to avoid cluttering the terminal
		if (now - lastRefusalNotice > 3000) {
			lastRefusalNotice = now;
			customLogger.warn(
				`[vite proxy] Backend on port 5000 is not reachable yet. Ensure your backend is running ("npm run dev" in root).`,
				{ timestamp: true }
			);
		}
		return;
	}
	originalLoggerError(msg, options);
};

// https://vitejs.dev/config/
export default defineConfig({
	customLogger,
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
			manifest: {
				name: "Spools",
				short_name: "Spools",
				description: "A social media platform built on MERN.",
				theme_color: "#1A202C",
				background_color: "#1A202C",
				display: "standalone",
				icons: [
					{
						src: "/pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any maskable"
					},
					{
						src: "/pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable"
					},
				],
			},
		}),
	],
	server: {
		port: 3000,
		// Proxy /api requests to backend
		proxy: {
			"/api": {
				target: "http://127.0.0.1:5000",
				changeOrigin: true,
				secure: false,
				configure: (proxy) => {
					proxy.on("error", (_err, _req, res) => {
						if (res && !res.headersSent && typeof res.writeHead === "function") {
							res.writeHead(503, { "Content-Type": "application/json" });
							res.end(
								JSON.stringify({
									error: "Backend server is starting up or temporarily unavailable",
								})
							);
						}
					});
				},
			},
		},
	},
});