import React from "react";
import DownloadForm from "./DatasetDownloadForm";
import DownloadKey from "./DatasetDownloadKey";

// `datasetKey` comes from the route. `dataset` comes from context and is for
// display only - it may briefly describe a different dataset, and it carries
// only the simple record's fields.
export default ({ downloadKey, datasetKey, dataset, location }) =>
  downloadKey ? (
    <DownloadKey
      downloadKey={downloadKey}
      datasetKey={datasetKey}
      dataset={dataset}
      location={location}
    />
  ) : (
    <DownloadForm
      datasetKey={datasetKey}
      dataset={dataset}
      location={location}
    />
  );
