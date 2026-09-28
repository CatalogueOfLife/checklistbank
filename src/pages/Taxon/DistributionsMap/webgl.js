// WebGL feature detection for MapLibre, adapted from
// https://maplibre.org/maplibre-gl-js/docs/examples/check-if-webgl-is-supported/
// MapLibre v5 no longer ships `maplibregl.supported()`, and a defined
// `WebGLRenderingContext` constructor says nothing about whether a context can
// actually be created (e.g. a Linux box with misconfigured graphics drivers).

let cached = null;

const probe = () => {
  if (typeof window === "undefined" || !window.WebGLRenderingContext) {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
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
