import React from "react";

import PageContent from "../../../components/PageContent";
import SectorPageContent from "../../catalogue/CatalogueSectors/SectorPageContent";

const ReleaseSectors = ({ datasetKey }) => {
  return (
    <PageContent>
      <SectorPageContent datasetKey={datasetKey} />
    </PageContent>
  );
};

export default ReleaseSectors;
