import React from "react";
import _ from "lodash";
import { NavLink, withRouter } from "react-router-dom";

const getDatasetTaxonRoute = (location, datasetKey, catalogueKey) => {
  return location.pathname.startsWith(`/catalogue/${catalogueKey}`)
    ? `/catalogue/${catalogueKey}/dataset/${datasetKey}/taxon/`
    : `/dataset/${datasetKey}/taxon/`;
};

const isAssembly = (location, catalogueKey) => {
  return (
    location.pathname.startsWith(`/catalogue/${catalogueKey}`) &&
    location.pathname.indexOf("/dataset") === -1
  );
};

const rankStyle = {
  color: "rgba(0, 0, 0, 0.45)",
  fontSize: "11px",
};
const ClassificationTable = ({
  datasetKey,
  data,
  taxon,
  style,
  catalogueKey,
  location,
}) => (
  <div style={style}>
    {" "}
    {_.reverse([...data]).map((t) => (
      <div style={{ float: "left", marginRight: "3px" }} key={t.rank}>
        <span style={rankStyle}>{t.rank}: </span>
        <NavLink
          to={{
            pathname: isAssembly(location, catalogueKey)
              ? `/catalogue/${catalogueKey}/taxon/${encodeURIComponent(_.get(t, "id"))}`
              : `${getDatasetTaxonRoute(
                  location,
                  datasetKey,
                  catalogueKey
                )}${encodeURIComponent(_.get(t, "id"))}`,
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: t.labelHtml }} />
        </NavLink>
        {" >"}
      </div>
    ))}
  </div>
);

export default withRouter(ClassificationTable);
