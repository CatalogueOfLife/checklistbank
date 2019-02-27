import React from "react";
import { Breadcrumb, Tooltip, Icon } from "antd";
import { NavLink } from "react-router-dom";

export const SectorClassification = ({ sector }) => {
   return sector.path ? 
      <Breadcrumb separator=">">
        {sector.path.reverse().map(taxon => {
          return (
            <Breadcrumb.sector key={taxon.id}>
              <NavLink
                to={{
                  pathname: `/dataset/${sector.datasetKey}/classification`,
                  search: `?taxonKey=${taxon.id}`
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
              </NavLink>
            </Breadcrumb.sector>
          );
        })}
      </Breadcrumb>
    :
      <React.Fragment>
        <Tooltip title="This sector is not linked to a taxon id">
          <Icon type="warning" theme="twoTone" twoToneColor="#FF6347" />
        </Tooltip>{" "}
        <span dangerouslySetInnerHTML={{ __html: sector.subject.name }} />
      </React.Fragment>
    
    };

