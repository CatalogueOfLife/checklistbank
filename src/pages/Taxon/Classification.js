import React from "react";
import _ from "lodash";
import { NavLink, withRouter } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";

const getDatasetClassificationRoute = (location, datasetKey, catalogueKey) => {
  return location.pathname.startsWith(`/catalogue/${catalogueKey}`) ?  `/catalogue/${catalogueKey}/dataset/${datasetKey}/classification`: `/dataset/${datasetKey}/classification`
}

const isAssembly = (location, catalogueKey) => {
  return location.pathname.startsWith(`/catalogue/${catalogueKey}`) && location.pathname.indexOf('/dataset') === -1
}

const ClassificationTable = ({ datasetKey, data, taxon, style, catalogueKey, location }) => (
  <div style={style}> {_.reverse([...data]).map(t => (
    <PresentationItem md={6} label={_.startCase(t.name.rank)} classes={{formItem: {borderBottom: 'none'}}} key={t.name.rank}>
      <NavLink
        to={{
          pathname: isAssembly(location, catalogueKey) ? `/catalogue/${catalogueKey}/assembly` : getDatasetClassificationRoute(location, datasetKey, catalogueKey ),
          search: `?${isAssembly(location, catalogueKey)  ? 'assemblyTaxonKey' : 'taxonKey'}=${t.id}`
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: t.labelHtml }} />
      </NavLink>
    </PresentationItem>
  ))} 
  <PresentationItem md={6} label={_.get(taxon, 'name.rank') ? _.startCase(taxon.name.rank) : ''} classes={{formItem: {borderBottom: 'none'}}} >
      <NavLink
        to={{
          pathname: isAssembly(location, catalogueKey) ? `/catalogue/${catalogueKey}/assembly` : getDatasetClassificationRoute(location, datasetKey, catalogueKey ),
          search: `?${isAssembly(location, catalogueKey)  ? 'assemblyTaxonKey' : 'taxonKey'}=${_.get(taxon, 'id')}`
        }}
      >
      { _.get(taxon, 'labelHtml') && <span dangerouslySetInnerHTML={{ __html: taxon.labelHtml }} />}
      </NavLink>
    </PresentationItem>
        
  </div>
);

export default withRouter(ClassificationTable);
