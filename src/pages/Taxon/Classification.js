import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import KeyValueList from "./KeyValueList";
import PresentationItem from "../../components/PresentationItem";

const ClassificationTable = ({ datasetKey, data, style }) => (
  <div style={style}> {_.reverse(data).map(t => (
    <PresentationItem md={6} label={_.startCase(t.name.rank)} key={t.name.rank}>
      <NavLink
        to={{
          pathname: `/dataset/${datasetKey}/classification`,
          search: `?taxonKey=${t.id}`
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: t.name.formattedName }} />
      </NavLink>
    </PresentationItem>
  ))} </div>
);

export default ClassificationTable;
