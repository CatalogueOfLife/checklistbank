import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";

const ClassificationTable = ({ datasetKey, data, style, catalogueKey }) => (
  <div style={style}> {_.reverse([...data]).map(t => (
    <PresentationItem md={6} label={_.startCase(t.name.rank)} classes={{formItem: {borderBottom: 'none'}}} key={t.name.rank}>
      <NavLink
        to={{
          pathname: datasetKey === catalogueKey ? `/catalogue/${catalogueKey}/assembly` : `/catalogue/${catalogueKey}/dataset/${datasetKey}/classification`,
          search: `?${datasetKey === catalogueKey ? 'assemblyTaxonKey' : 'taxonKey'}=${t.id}`
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: t.name.formattedName }} />
      </NavLink>
    </PresentationItem>
  ))} </div>
);

export default ClassificationTable;
