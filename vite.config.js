import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  // writeEnums.cjs needs NODE_ENV=dev|prod at build time to pick which API
  // to fetch enumerations from, but that same env var bleeds into the
  // bundled code — React and others branch on process.env.NODE_ENV and
  // include their development variants (warnings, devtools hooks) when
  // it's not "production". Pin the bundled value here so the deploy
  // script's NODE_ENV stays free to mean "which API for enums".
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    react(),
    // csvtojson (NameMatch.jsx) and diff2html pull in Node builtins. We
    // polyfill only what they actually need — keeping the bundle lean.
    // `util` is needed because a transitive dep calls util.debuglog /
    // util.inspect; without the polyfill Vite externalises it and the
    // browser warns on every page load.
    nodePolyfills({
      include: ["buffer", "fs", "os", "path", "process", "stream", "util"],
      globals: { Buffer: true, process: true },
    }),
  ],
  // CRA listened on 0.0.0.0 by default; Vite's default `localhost` resolves
  // to IPv6 only on macOS, which breaks the 127.0.0.1-based dev-API trick
  // (see src/config.js — anything that doesn't end in "localhost" picks the
  // dev backend). Bind both v4 and v6 so 127.0.0.1 works too.
  server: { port: 3000, host: true, open: false },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split heavy vendor libs into their own chunks so the browser can
        // cache them across deploys and load them in parallel with the app
        // shell. Without this split, a single index-*.js was 4.5 MB / 1.3 MB
        // gzipped. Rolldown (Vite 8's bundler) requires the function form;
        // the classic Rollup object form throws "manualChunks is not a
        // function".
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("/highcharts/") || id.includes("/highcharts-react-official/")) return "highcharts";
          if (id.includes("/maplibre-gl/")) return "maplibre";
          if (id.includes("/antd/") || id.includes("/@ant-design/icons/") || id.includes("/rc-")) return "antd";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router/") ||
            id.includes("/react-router-dom/") ||
            id.includes("/react-helmet-async/") ||
            id.includes("/scheduler/")
          ) return "react";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
  },
});
