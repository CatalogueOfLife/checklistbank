import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import BorderedListItem from "./BorderedListItem"
import ReferencePopover from "../Reference/ReferencePopover"
const SynonymsTable = ({ datasetKey, data, style }) => {
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
                pathname: `/dataset/${datasetKey}/name/${encodeURIComponent(
                  _.get(s, 'name.id')
                )}`
              }}
              exact={true}
            >
            {(_.get(s, 'name.homotypicNameId') && _.get(s, 'accepted.name.homotypicNameId') && _.get(s, 'accepted.name.homotypicNameId') === _.get(s, 'name.homotypicNameId') ) ? '≡ ' : '= '}  <span dangerouslySetInnerHTML={{ __html: _.get(s, 'name.formattedName') }} /> {_.get(s, 'name.nomStatus') && `(${_.get(s, 'name.nomStatus')})`}
            </NavLink> 
            {" "}
              <ReferencePopover datasetKey={datasetKey} referenceId={s.referenceIds} placement="bottom"/>
          </BorderedListItem>
        ))}
    </div>
  );
};

export default SynonymsTable;
