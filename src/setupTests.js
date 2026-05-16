// Some modules read from localStorage/sessionStorage at import time
// (e.g. src/api/user.js loads a stored JWT into sessionStorage). Node 22+
// has a native `localStorage` global that vitest's jsdom can clash with;
// install our own polyfill before any source modules load.

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  key(index) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key) {
    this.store.delete(key);
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
}

if (typeof globalThis.localStorage === "undefined" || globalThis.localStorage === null) {
  Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage() });
}
if (typeof globalThis.sessionStorage === "undefined" || globalThis.sessionStorage === null) {
  Object.defineProperty(globalThis, "sessionStorage", { value: new MemoryStorage() });
}
