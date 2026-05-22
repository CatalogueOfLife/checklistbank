// highcharts-react-official 3.2.x ships an old UMD bundle whose exports
// shape is { __esModule: true, HighchartsReact: Component, default: Component }.
// Vite 7 / esbuild auto-unwrapped that into the component on default import;
// Vite 8 / Rolldown exposes the wrapper object instead, so the bare
// `import HighchartsReact from "highcharts-react-official"` returns an object
// and React errors with "Element type is invalid... got: object".
//
// This wrapper picks the component out of whichever shape we get, so callers
// can keep using a normal default import.
import HCR from "highcharts-react-official";

const HighchartsReact = HCR?.default ?? HCR;

export default HighchartsReact;
