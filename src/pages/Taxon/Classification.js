import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";

const ClassificationTable = ({ datasetKey, data, taxon, style, catalogueKey }) => (
  <div style={style}> {_.reverse([...data]).map(t => (
    <PresentationItem md={6} label={_.startCase(t.name.rank)} classes={{formItem: {borderBottom: 'none'}}} key={t.name.rank}>
      <NavLink
        to={{
          pathname: datasetKey === catalogueKey ? `/catalogue/${catalogueKey}/assembly` : `/dataset/${datasetKey}/classification`,
          search: `?${datasetKey === catalogueKey ? 'assemblyTaxonKey' : 'taxonKey'}=${t.id}`
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: t.labelHtml }} />
      </NavLink>
    </PresentationItem>
  ))} 
  <PresentationItem md={6} label={_.get(taxon, 'name.rank') ? _.startCase(taxon.name.rank) : ''} classes={{formItem: {borderBottom: 'none'}}} >
      <NavLink
        to={{
          pathname: datasetKey === catalogueKey ? `/catalogue/${catalogueKey}/assembly` : `/dataset/${datasetKey}/classification`,
          search: `?${datasetKey === catalogueKey ? 'assemblyTaxonKey' : 'taxonKey'}=${_.get(taxon, 'id')}`
        }}
      >
      { _.get(taxon, 'labelHtml') && <span dangerouslySetInnerHTML={{ __html: taxon.labelHtml }} />}
      </NavLink>
    </PresentationItem>
        
  </div>
);

export default ClassificationTable;
