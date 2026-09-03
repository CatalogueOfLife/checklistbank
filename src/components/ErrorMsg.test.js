import { describe, expect, it } from "vitest";
import { isApiUnavailable } from "./ErrorMsg";

describe("isApiUnavailable", () => {
  it("treats proxy 5xx from a dead backend as unavailable", () => {
    for (const status of [502, 503, 504]) {
      expect(isApiUnavailable({ response: { status } })).toBe(true);
    }
  });

  it("leaves real application errors alone", () => {
    // a 500 is the backend reporting a bug and should keep the issue link
    for (const status of [400, 401, 403, 404, 413, 431, 500]) {
      expect(isApiUnavailable({ response: { status } })).toBe(false);
    }
  });

  it("catches the opaque failure a rejected CORS preflight produces", () => {
    // no response, no status - all javascript is given is a network error
    expect(
      isApiUnavailable({
        code: "ERR_NETWORK",
        message: "Network Error",
        request: {},
      })
    ).toBe(true);
    expect(isApiUnavailable({ request: {} })).toBe(true);
    expect(isApiUnavailable({ code: "ECONNABORTED" })).toBe(true);
  });

  it("does not mistake an ordinary thrown error for an outage", () => {
    expect(isApiUnavailable(new Error("boom"))).toBe(false);
    expect(isApiUnavailable({ message: "Cannot read property of undefined" })).toBe(
      false
    );
    expect(isApiUnavailable(undefined)).toBe(false);
    expect(isApiUnavailable(null)).toBe(false);
  });
});
