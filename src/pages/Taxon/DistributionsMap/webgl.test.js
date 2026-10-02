import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isWebglSupported, resetWebglSupportCache } from "./webgl";

describe("isWebglSupported", () => {
  const originalCtor = window.WebGL2RenderingContext;

  beforeEach(() => {
    resetWebglSupportCache();
    window.WebGL2RenderingContext = function WebGL2RenderingContext() {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.WebGL2RenderingContext = originalCtor;
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

  it("is false without WebGL2RenderingContext", () => {
    delete window.WebGL2RenderingContext;
    expect(isWebglSupported()).toBe(false);
  });

  it("is false when only a WebGL1 context is available", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (type) => (type === "webgl" ? { getParameter: () => null } : null)
    );
    expect(isWebglSupported()).toBe(false);
  });

  it("caches the probe result", () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);
    isWebglSupported();
    isWebglSupported();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
