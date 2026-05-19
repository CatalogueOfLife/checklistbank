import { useState } from "react";
import config from "../../config";

const DatasetLogo = ({
  fallBack = null,
  datasetKey,
  style = {},
  size = "MEDIUM",
  maxWidth = 200,
  maxHeight = 50,
}) => {
  const [error, setError] = useState(true);
  const [loading, setLoading] = useState(true);
  return loading || !error ? (
    <img
      style={{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px`, ...style }}
      alt={`Dataset ${datasetKey} logo`}
      src={`${config.dataApi}dataset/${datasetKey}/logo?size=${size}`}
      onLoad={() => { setError(false); setLoading(false); }}
      onError={() => { setError(true); setLoading(false); }}
    />
  ) : (
    fallBack
  );
};
export default DatasetLogo;
