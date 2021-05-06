import React from "react";
import DownloadForm from "./DatasetDownloadForm";
import DownloadKey from "./DatasetDownloadKey";

export default ({ downloadKey, dataset, location }) =>
  downloadKey ? (
    <DownloadKey
      downloadKey={downloadKey}
      dataset={dataset}
      location={location}
    />
  ) : (
    <DownloadForm dataset={dataset} location={location} />
  );
