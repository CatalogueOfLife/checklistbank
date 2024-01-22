import React from "react";

import PageContent from "../../../components/PageContent";
import Decisions from "../../catalogue/CatalogueDecisions/Decisions";
import withContext from "../../../components/hoc/withContext";

const DatasetDecisions = ({ dataset }) => {
  return (
    <PageContent>
      <Decisions
        datasetKey={dataset?.key}
        releasedFrom={dataset?.sourceKey}
        type="release"
      />
    </PageContent>
  );
};

const mapContextToProps = ({ addError, dataset }) => ({ addError, dataset });
export default withContext(mapContextToProps)(DatasetDecisions);
