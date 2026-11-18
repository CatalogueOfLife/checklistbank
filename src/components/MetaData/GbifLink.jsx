import config from "../../config";

/**
 * The GBIF logo linking to the dataset page on GBIF. Sits next to the YAML,
 * EML and BibTeX logos of the metadata page.
 */
const GbifLink = ({ gbifKey, style = {} }) => (
  <a
    href={`${config.gbifUrl}dataset/${gbifKey}`}
    target="_blank"
    rel="noreferrer"
    title="View this dataset on GBIF"
  >
    <img
      src="/images/gbif_logo.svg"
      alt="GBIF"
      style={{ height: "28px", margin: "0 8px 6px 0", ...style }}
    />
  </a>
);

export default GbifLink;
