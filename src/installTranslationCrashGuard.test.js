import { describe, it, expect, beforeAll } from "vitest";
import installTranslationCrashGuard from "./installTranslationCrashGuard";

// Reproduces the conditions of issue #1669: a browser translator reparents a
// text node (into a <font> wrapper) after React has recorded its parent, so a
// later removeChild/insertBefore from React targets a node that is no longer a
// child. Without the guard the DOM call throws NotFoundError and blanks the
// page; with it the call is a harmless no-op while valid calls still work.
describe("installTranslationCrashGuard", () => {
  beforeAll(() => installTranslationCrashGuard());

  it("no-ops removeChild when the child was reparented out from under the caller", () => {
    const recordedParent = document.createElement("div");
    const child = document.createTextNode("no");
    recordedParent.appendChild(child);

    // Translator moves the text node into a <font> wrapper.
    const font = document.createElement("font");
    font.appendChild(child);
    expect(child.parentNode).toBe(font);

    expect(() => recordedParent.removeChild(child)).not.toThrow();
    // The node is left where the translator put it, not detached.
    expect(child.parentNode).toBe(font);
  });

  it("still removes a genuine child normally", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    expect(() => parent.removeChild(child)).not.toThrow();
    expect(parent.contains(child)).toBe(false);
    expect(child.parentNode).toBe(null);
  });

  it("no-ops insertBefore when the reference node was reparented", () => {
    const recordedParent = document.createElement("div");
    const ref = document.createElement("span");
    recordedParent.appendChild(ref);

    const font = document.createElement("font");
    font.appendChild(ref);

    const newNode = document.createElement("em");
    expect(() => recordedParent.insertBefore(newNode, ref)).not.toThrow();
  });

  it("still inserts before a genuine reference node, and appends when ref is null", () => {
    const parent = document.createElement("div");
    const ref = document.createElement("span");
    parent.appendChild(ref);

    const first = document.createElement("a");
    parent.insertBefore(first, ref);
    expect(parent.firstChild).toBe(first);

    const last = document.createElement("b");
    parent.insertBefore(last, null); // null reference => append
    expect(parent.lastChild).toBe(last);
  });
});
