import React from "react";

export const RecentDatasetsContext = React.createContext({
    datasets: [],
    setDatasets: () => {},
    getDatasets: () => {}
  });