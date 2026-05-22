import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
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
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
  },
});
