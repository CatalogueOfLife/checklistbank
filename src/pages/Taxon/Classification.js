import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import KeyValueList from "./KeyValueList";
import PresentationItem from "../../components/PresentationItem";

const ClassificationTable = ({ datasetKey, data }) => {
  return _.reverse(data).map(t => (
    <PresentationItem label={t.name.rank}>
      <NavLink
        to={{
          pathname: `/dataset/${datasetKey}/classification`,
          search: `?taxonKey=${t.id}`
        }}
      >
        {t.name.scientificName}
      </NavLink>
    </PresentationItem>
  ));
};

export default ClassificationTable;
