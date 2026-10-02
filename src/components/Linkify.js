// Single import point for the <Linkify> component (linkify-react, which shares
// linkifyjs with the linkify-html helper used elsewhere). It replaced the
// unmaintained react-linkify, whose CJS default export had to be unwrapped
// by hand under Vite 8 / Rolldown (issues #1667/#1668); keep that guard in
// case the package ever resolves to its CJS build.
import LinkifyModule from "linkify-react";

const Linkify = LinkifyModule?.default ?? LinkifyModule;

export default Linkify;
