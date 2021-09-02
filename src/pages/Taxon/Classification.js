import React from "react";
import _ from "lodash";
import { NavLink, withRouter } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";

const getDatasetTaxonRoute = (location, datasetKey, catalogueKey) => {
  return location.pathname.startsWith(`/catalogue/${catalogueKey}`)
    ? `/catalogue/${catalogueKey}/dataset/${datasetKey}/taxon/`
    : `/dataset/${datasetKey}/taxon/`;
};

const getDatasetTreeRoute = (location, datasetKey, catalogueKey) => {
  return location.pathname.startsWith(`/catalogue/${catalogueKey}`)
    ? `/catalogue/${catalogueKey}/dataset/${datasetKey}/classification`
    : `/dataset/${datasetKey}/classification`;
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
              ? `/catalogue/${catalogueKey}/taxon/${_.get(t, "id")}`
              : `${getDatasetTaxonRoute(
                  location,
                  datasetKey,
                  catalogueKey
                )}${_.get(t, "id")}`,
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: t.labelHtml }} />
        </NavLink>
        {" >"}
      </div>
    ))}
    <div style={{ float: "left" }}>
      {_.get(taxon, "name.rank") && (
        <span style={rankStyle}>{taxon.name.rank}: </span>
      )}
      <NavLink
        to={{
          pathname: isAssembly(location, catalogueKey)
            ? `/catalogue/${catalogueKey}/assembly`
            : getDatasetTreeRoute(location, datasetKey, catalogueKey),
          search: isAssembly(location, catalogueKey)
            ? `?assemblyTaxonKey=${encodeURIComponent(_.get(taxon, "id"))}`
            : `?taxonKey=${encodeURIComponent(_.get(taxon, "id"))}`,
        }}
      >
        {_.get(taxon, "labelHtml") && (
          <span dangerouslySetInnerHTML={{ __html: taxon.labelHtml }} />
        )}
      </NavLink>
    </div>
  </div>
);

export default withRouter(ClassificationTable);
