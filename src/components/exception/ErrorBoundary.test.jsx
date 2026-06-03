import { describe, it, expect } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

// The repo's test setup has no React renderer wired up (App.test.js avoids
// rendering on purpose), so we test the error-boundary contract through its
// static lifecycle methods. That is where the non-trivial logic lives: the
// reset-on-navigation behaviour that lets a stuck error clear itself when the
// user moves to another page.

describe("ErrorBoundary.getDerivedStateFromError", () => {
  it("captures the thrown error into state", () => {
    const err = new Error("kaboom");
    expect(ErrorBoundary.getDerivedStateFromError(err)).toEqual({ error: err });
  });
});

describe("ErrorBoundary.getDerivedStateFromProps", () => {
  const err = new Error("kaboom");

  it("keeps the captured error while resetKey is unchanged", () => {
    expect(
      ErrorBoundary.getDerivedStateFromProps(
        { resetKey: "/a" },
        { error: err, resetKey: "/a" }
      )
    ).toBeNull();
  });

  it("clears the error when resetKey changes (navigation to a new page)", () => {
    expect(
      ErrorBoundary.getDerivedStateFromProps(
        { resetKey: "/b" },
        { error: err, resetKey: "/a" }
      )
    ).toEqual({ error: null, resetKey: "/b" });
  });

  it("syncs resetKey without resurrecting an error when there is none", () => {
    expect(
      ErrorBoundary.getDerivedStateFromProps(
        { resetKey: "/b" },
        { error: null, resetKey: "/a" }
      )
    ).toEqual({ error: null, resetKey: "/b" });
  });
});
