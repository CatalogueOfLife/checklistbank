// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseAst } from "rolldown/parseAst";
import { createRequire } from "node:module";

// vite.config.js polyfills fs/path for the browser bundle, and the plugin
// rewrites them here too, leaving a null shim. This test walks the real
// filesystem, so reach past the polyfill for the genuine node builtins.
const nodeRequire = createRequire(import.meta.url);
const fs = nodeRequire("node:fs");
const path = nodeRequire("node:path");

// The repo has no linter, so nothing catches a reference to a name that was
// never imported or declared. That is not a theoretical risk: the "remove
// unused imports" sweep in 730b4389 dropped two imports that were genuinely
// in use, and the resulting `getColumns is not defined` took down the sector
// priority page in production (checklistbank#1722).
//
// This guard parses every source file and reports identifiers that are read
// but bound nowhere in the file. It deliberately over-approximates the set of
// bindings — any name declared in *any* scope of a file counts as bound — so
// it can miss a shadowing-related bug, but it never invents one. A file-level
// check is enough for the bug class it exists for: a missing import.

const SRC = path.join(import.meta.dirname);

const GLOBALS = new Set([
  // language
  "undefined", "NaN", "Infinity", "globalThis", "arguments", "eval",
  "Object", "Array", "String", "Number", "Boolean", "Symbol", "BigInt", "Math",
  "JSON", "Date", "RegExp", "Promise", "Map", "Set", "WeakMap", "WeakSet",
  "Proxy", "Reflect", "Intl", "Function",
  "Error", "TypeError", "RangeError", "SyntaxError", "EvalError", "ReferenceError",
  "parseInt", "parseFloat", "isNaN", "isFinite", "structuredClone", "queueMicrotask",
  "encodeURIComponent", "decodeURIComponent", "encodeURI", "decodeURI",
  "ArrayBuffer", "DataView", "Uint8Array", "Int8Array", "Uint16Array", "Int16Array",
  "Uint32Array", "Int32Array", "Float32Array", "Float64Array",
  // browser
  "window", "document", "console", "navigator", "location", "history", "screen",
  "localStorage", "sessionStorage", "performance", "crypto", "self",
  "setTimeout", "clearTimeout", "setInterval", "clearInterval",
  "requestAnimationFrame", "cancelAnimationFrame", "requestIdleCallback",
  "fetch", "Headers", "Request", "Response", "AbortController", "AbortSignal",
  "XMLHttpRequest", "WebSocket", "EventSource", "URL", "URLSearchParams",
  "Blob", "File", "FileReader", "FormData", "DataTransfer", "atob", "btoa",
  "alert", "confirm", "prompt", "getComputedStyle", "matchMedia",
  "Event", "CustomEvent", "MessageEvent", "KeyboardEvent", "MouseEvent",
  "EventTarget", "Node", "Element", "HTMLElement", "HTMLCanvasElement",
  "Image", "Audio", "DOMParser", "XMLSerializer", "CSS", "Text",
  "MutationObserver", "IntersectionObserver", "ResizeObserver",
  "TextEncoder", "TextDecoder", "WebGLRenderingContext", "WebGL2RenderingContext",
  // node / build-time, used by the polyfilled tool pages
  "process", "Buffer", "require", "module", "exports", "__dirname", "__filename", "global",
]);

const walk = (node, visit, parent = null, key = null) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit, parent, key);
    return;
  }
  if (typeof node.type !== "string") return;
  if (visit(node, parent, key) === false) return;
  for (const k of Object.keys(node)) {
    if (k === "type" || k === "start" || k === "end") continue;
    walk(node[k], visit, node, k);
  }
};

// Names introduced by a binding pattern: `{ a, b: c }`, `[d]`, `e = 1`, `...f`.
const patternNames = (pattern, add) =>
  walk(pattern, (node, parent, key) => {
    // In `{ rank: rankEnum }` only rankEnum binds; `rank` is a property name.
    if (parent?.type === "Property" && key === "key" && !parent.computed) return false;
    // In `x = default` only the left side binds; the default is an expression.
    if (parent?.type === "AssignmentPattern" && key === "right") return false;
    if (node.type === "Identifier") add(node.name);
    return true;
  });

const collectBindings = (ast) => {
  const bound = new Set();
  const add = (name) => bound.add(name);
  walk(ast, (node) => {
    switch (node.type) {
      case "ImportDefaultSpecifier":
      case "ImportNamespaceSpecifier":
      case "ImportSpecifier":
        if (node.local?.name) add(node.local.name);
        break;
      case "VariableDeclarator":
        patternNames(node.id, add);
        break;
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        if (node.id?.name) add(node.id.name);
        node.params?.forEach((p) => patternNames(p, add));
        break;
      case "ClassDeclaration":
      case "ClassExpression":
        if (node.id?.name) add(node.id.name);
        break;
      case "CatchClause":
        if (node.param) patternNames(node.param, add);
        break;
      case "ForInStatement":
      case "ForOfStatement":
        if (node.left && node.left.type !== "VariableDeclaration") patternNames(node.left, add);
        break;
      case "LabeledStatement":
        if (node.label?.name) add(node.label.name);
        break;
    }
    return true;
  });
  return bound;
};

const collectReferences = (ast) => {
  const refs = new Map(); // name -> character offset of first read
  walk(ast, (node, parent, key) => {
    // `import.meta` is a MetaProperty, not a read of `import` or `meta`.
    if (node.type === "MetaProperty") return false;
    if (parent) {
      const p = parent.type;
      // binding positions, handled by collectBindings
      if (p === "ImportSpecifier" || p === "ImportDefaultSpecifier" ||
          p === "ImportNamespaceSpecifier" || p === "ExportSpecifier") return false;
      if (p === "VariableDeclarator" && key === "id") return false;
      if ((p === "FunctionDeclaration" || p === "FunctionExpression" ||
           p === "ArrowFunctionExpression") && (key === "params" || key === "id")) return false;
      if ((p === "ClassDeclaration" || p === "ClassExpression") && key === "id") return false;
      if (p === "CatchClause" && key === "param") return false;
      // names that are not variable reads
      if (p === "MemberExpression" && key === "property" && !parent.computed) return false;
      if ((p === "Property" || p === "PropertyDefinition" || p === "MethodDefinition") &&
          key === "key" && !parent.computed) return false;
      if (p === "LabeledStatement" || p === "BreakStatement" || p === "ContinueStatement") return false;
      if (p === "JSXAttribute" && key === "name") return false;
      if (p === "JSXMemberExpression" && key === "property") return false;
      if (p === "JSXClosingElement" || p === "JSXNamespacedName") return false;
    }
    if (node.type === "Identifier") {
      if (!refs.has(node.name)) refs.set(node.name, node.start);
      return false;
    }
    // <Foo /> reads the binding Foo; <div /> is an intrinsic element.
    if (node.type === "JSXIdentifier") {
      if (/^[A-Z]/.test(node.name) && !refs.has(node.name)) refs.set(node.name, node.start);
      return false;
    }
    return true;
  });
  return refs;
};

const sourceFiles = function* (dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (/\.jsx?$/.test(entry.name)) yield full;
  }
};

describe("undefined identifiers", () => {
  it("every name read in src/ is imported or declared in its file", () => {
    const problems = [];
    for (const file of sourceFiles(SRC)) {
      const source = fs.readFileSync(file, "utf8");
      const ast = parseAst(source, { lang: "jsx" });
      const bound = collectBindings(ast);
      for (const [name, offset] of collectReferences(ast)) {
        if (bound.has(name) || GLOBALS.has(name)) continue;
        const line = source.slice(0, offset).split("\n").length;
        problems.push(`${path.relative(SRC, file)}:${line}  ${name}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
