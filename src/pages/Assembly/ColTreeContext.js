import React from "react";

export const ColTreeContext = React.createContext({
    mode: "attach",
    selectedSourceDatasetKey: null,
    toggleMode: () => {},
    getSyncState: () => {}
  });


  