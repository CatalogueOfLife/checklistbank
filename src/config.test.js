import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

/**
 * config.js resolves the environment once, at import time, from the hostname.
 * Three deployments exist and each has to reach its own API; the header banner
 * (see LayoutNew) keys off the resulting `env` too.
 */
const originalLocation = window.location;

const envFor = async (hostname) => {
  Object.defineProperty(window, "location", {
    value: { hostname },
    writable: true,
    configurable: true,
  });
  vi.resetModules();
  const { default: config } = await import("./config");
  return config;
};

afterAll(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("environment detection", () => {
  it("serves prod from www.checklistbank.org", async () => {
    const env = await envFor("www.checklistbank.org");
    expect(env.env).toBe("prod");
    expect(env.dataApi).toBe("https://api.checklistbank.org/");
  });

  it("serves test from the test domain", async () => {
    for (const host of ["www.test.checklistbank.org", "test.checklistbank.org"]) {
      const env = await envFor(host);
      expect(env.env).toBe("test");
      expect(env.dataApi).toBe("https://api.test.checklistbank.org/");
    }
  });

  it("serves dev from the dev domain", async () => {
    const env = await envFor("www.dev.checklistbank.org");
    expect(env.env).toBe("dev");
    expect(env.dataApi).toBe("https://api.dev.checklistbank.org/");
  });

  it("points localhost at prod, and any other host at dev", async () => {
    expect((await envFor("localhost")).env).toBe("prod");
    expect((await envFor("127.0.0.1")).env).toBe("dev");
  });
});
