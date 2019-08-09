import React from "react";

export const ColTreeContext = React.createContext({
    mode: "attach",
    selectedSourceDatasetKey: null,
    syncState: null,
    syncingSector: null,
    toggleMode: () => {},
    getSyncState: () => {}
  });


  