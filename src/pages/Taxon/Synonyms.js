import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem"
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover"
const SynonymsTable = ({ datasetKey, data, style, catalogueKey }) => {
  const uri =  `/dataset/${datasetKey}/name/`;
  return (
    <div style={style}>
      {data
        .map(s => {
          return s[0] ? s[0] : s;
        })
        .map(s => (
          <BorderedListItem key={_.get(s, 'name.id')}>
            <NavLink
              to={{
                pathname:   `${uri}${encodeURIComponent(
                  _.get(s, 'name.id')
                )}`
              }}
              exact={true}
            >
            {(_.get(s, 'name.homotypicNameId') && _.get(s, 'accepted.name.homotypicNameId') && _.get(s, 'accepted.name.homotypicNameId') === _.get(s, 'name.homotypicNameId') ) ? '≡ ' : '= '}  <span dangerouslySetInnerHTML={{ __html: _.get(s, 'labelHtml') }} /> {_.get(s, 'name.nomStatus') && `(${_.get(s, 'name.nomStatus')})`} {_.get(s, 'status') === 'misapplied' && _.get(s, 'accordingTo') ?  _.get(s, 'accordingTo') :''}
            </NavLink> 
            {" "}
              <ReferencePopover datasetKey={datasetKey} referenceId={s.referenceIds} placement="bottom"/>
          </BorderedListItem>
        ))}
    </div>
  );
};

export default SynonymsTable;
