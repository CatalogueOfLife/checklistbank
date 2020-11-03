import React from "react";
import PageContent from "../../../components/PageContent";
import RefTable from "../../catalogue/CatalogueReferences/RefTable";

export default ({ location, datasetKey }) => (
  <PageContent>
    <RefTable location={location} datasetKey={datasetKey} />
  </PageContent>
);
