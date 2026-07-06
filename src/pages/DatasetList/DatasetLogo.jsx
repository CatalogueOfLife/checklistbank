import { useState, useEffect } from "react";
import config from "../../config";
import useLogoSrc from "../../components/useLogoSrc";

/**
 * Renders a dataset logo, transparently handling authentication.
 *
 * Public logos load natively (cacheable). For private datasets the logo
 * endpoint needs the JWT bearer token, which a plain <img src> cannot send,
 * so useLogoSrc fetches the image with axios and hands back an object URL.
 *
 * Pass `sourceKey` to render a release/project source logo
 * (dataset/{datasetKey}/logo/source/{sourceKey}) instead of the dataset's own.
 * `maxWidth`/`maxHeight` cap the rendered size; pass null to leave uncapped.
 */
const DatasetLogo = ({
  fallBack = null,
  datasetKey,
  sourceKey,
  private: isPrivate = false,
  alt,
  style = {},
  size = "MEDIUM",
  maxWidth = 200,
  maxHeight = 50,
}) => {
  const base = `${config.dataApi}dataset/${datasetKey}/logo`;
  const url = datasetKey
    ? `${sourceKey ? `${base}/source/${sourceKey}` : base}?size=${size}`
    : null;
  const { src, error: fetchError } = useLogoSrc(url, isPrivate);
  const [imgError, setImgError] = useState(false);

  // clear the error whenever a new src is attempted (e.g. a private dataset
  // that first rendered with an unknown privacy flag, then loads via blob)
  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (fetchError || imgError) return fallBack;
  // private logos have no src until the authed blob fetch resolves
  if (!src) return null;

  const dims = {};
  if (maxWidth != null) dims.maxWidth = `${maxWidth}px`;
  if (maxHeight != null) dims.maxHeight = `${maxHeight}px`;

  return (
    <img
      style={{ ...dims, ...style }}
      alt={alt || `Dataset ${datasetKey} logo`}
      src={src}
      onError={() => setImgError(true)}
    />
  );
};
export default DatasetLogo;
