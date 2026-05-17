import React from "react";
import _ from "lodash";
import { NavLink, withRouter } from "react-router-dom";

const getDatasetTaxonRoute = (location, datasetKey, projectKey) => {
  return location.pathname.startsWith(`/project/${projectKey}`)
    ? `/project/${projectKey}/dataset/${datasetKey}/taxon/`
    : `/dataset/${datasetKey}/taxon/`;
};

const isAssembly = (location, projectKey) => {
  return (
    location.pathname.startsWith(`/project/${projectKey}`) &&
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
  projectKey,
  location,
}) => (
  <div style={style}>
    {" "}
    {data.map((t) => (
      <div style={{ float: "left", marginRight: "3px" }} key={t.rank}>
        <span style={rankStyle}>{t.rank}: </span>
        <NavLink
          to={{
            pathname: isAssembly(location, projectKey)
              ? `/project/${projectKey}/taxon/${encodeURIComponent(_.get(t, "id"))}`
              : `${getDatasetTaxonRoute(
                  location,
                  datasetKey,
                  projectKey
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
