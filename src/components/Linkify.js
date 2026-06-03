// react-linkify is a CJS module that sets __esModule: true and assigns
// module.exports.default. Vite 7 / esbuild auto-unwrapped that; Vite 8 /
// Rolldown returns the wrapper object on default import, so rendering
// <Linkify> crashed with React #130 ("Element type is invalid ... got:
// object") — this blanked the taxon page for any taxon with a publishedIn
// citation (issues #1667/#1668). Unwrap once here; always import Linkify
// from this module, never from "react-linkify" directly.
import LinkifyModule from "react-linkify";

const Linkify = LinkifyModule?.default ?? LinkifyModule;

export default Linkify;
