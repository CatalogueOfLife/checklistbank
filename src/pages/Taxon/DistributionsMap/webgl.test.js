import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isWebglSupported, resetWebglSupportCache } from "./webgl";

describe("isWebglSupported", () => {
  const originalCtor = window.WebGLRenderingContext;

  beforeEach(() => {
    resetWebglSupportCache();
    window.WebGLRenderingContext = function WebGLRenderingContext() {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.WebGLRenderingContext = originalCtor;
  });

  it("is true when a usable context can be created", () => {
    const loseContext = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getParameter: () => null,
      getExtension: () => ({ loseContext }),
    });
    expect(isWebglSupported()).toBe(true);
    expect(loseContext).toHaveBeenCalled();
  });

  it("is false when no context can be created", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(isWebglSupported()).toBe(false);
  });

  it("is false when context creation throws", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => {
        throw new Error("boom");
      }
    );
    expect(isWebglSupported()).toBe(false);
  });

  it("is false without WebGLRenderingContext", () => {
    delete window.WebGLRenderingContext;
    expect(isWebglSupported()).toBe(false);
  });

  it("caches the probe result", () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);
    isWebglSupported();
    isWebglSupported();
    expect(spy).toHaveBeenCalledTimes(2); // webgl2 + webgl, once
  });
});
