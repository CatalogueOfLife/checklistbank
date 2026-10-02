// WebGL feature detection for MapLibre, adapted from
// https://maplibre.org/maplibre-gl-js/docs/examples/check-if-webgl-is-supported/
// MapLibre v5 no longer ships `maplibregl.supported()`, and a defined
// `WebGL2RenderingContext` constructor says nothing about whether a context can
// actually be created (e.g. a Linux box with misconfigured graphics drivers).
// MapLibre v6 dropped WebGL1, so only a WebGL2 context counts.

let cached = null;

const probe = () => {
  if (typeof window === "undefined" || !window.WebGL2RenderingContext) {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2");
    if (!ctx || typeof ctx.getParameter !== "function") return false;
    // Browsers cap the number of live contexts, so free the probe right away.
    ctx.getExtension?.("WEBGL_lose_context")?.loseContext();
    return true;
  } catch (e) {
    // WebGL exists but is disabled or broken.
    return false;
  }
};

export const isWebglSupported = () => {
  if (cached === null) cached = probe();
  return cached;
};

// Test-only: force the next call to probe again.
export const resetWebglSupportCache = () => {
  cached = null;
};
