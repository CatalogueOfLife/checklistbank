import React from "react";

export const ColTreeContext = React.createContext({
  mode: "attach",
  selectedSourceDatasetKey: null,
  assemblyTaxonKey: null,
  sourceTaxonKey: null,
  toggleMode: () => {},
  selectedSourceTreeNodes: [],
  selectedAssemblyTreeNodes: [],
});
