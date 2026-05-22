import React from "react";
import PageContent from "../../../components/PageContent";
import RefTable from "../../project/ProjectReferences/RefTable";

export default ({ location, datasetKey }) => (
  <PageContent>
    <RefTable location={location} datasetKey={datasetKey} />
  </PageContent>
);
