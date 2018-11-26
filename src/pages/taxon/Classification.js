import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import KeyValueList from './KeyValueList'


const ClassificationTable = ({ datasetKey, data }) => {
  let classification = _.reverse(data).map( t => {
    return {
      key: t.name.rank,
      value: <NavLink
          to={{
            pathname: `/dataset/${datasetKey}/classification`,
            search: `?taxonKey=${t.id}`
          }}
        >
          {t.name.scientificName}
        </NavLink>
      
    };
  });
  return <KeyValueList data={classification}></KeyValueList>
}

export default ClassificationTable;
