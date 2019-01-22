import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import KeyValueList from "./KeyValueList";
import PresentationItem from "../../components/PresentationItem";

const ClassificationTable = ({ datasetKey, data }) => {
  return _.reverse(data).map(t => (
    <PresentationItem label={_.startCase(t.name.rank)}>
      <NavLink
        to={{
          pathname: `/dataset/${datasetKey}/classification`,
          search: `?taxonKey=${t.id}`
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: t.name.formattedName }} />
      </NavLink>
    </PresentationItem>
  ));
};

export default ClassificationTable;
