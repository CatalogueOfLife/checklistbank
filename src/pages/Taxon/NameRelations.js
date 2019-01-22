import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import PresentationItem from "../../components/PresentationItem";
const NameRelations = ({ data }) => {
  return (
    <React.Fragment>
      {data
        .map(r => (
          <PresentationItem key={r.key} label={_.startCase(r.type)}>
           <NavLink
              to={{
                pathname: `/dataset/${r.datasetKey}/name/${encodeURIComponent(
                  r.relatedName.id
                )}`
              }}
              exact={true}
            >
            <span dangerouslySetInnerHTML={{__html: r.relatedName.formattedName}}></span>
            </NavLink>
          </PresentationItem>
        ))}
    </React.Fragment>
  );
};

export default NameRelations;
