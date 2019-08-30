import React from "react";
import { Breadcrumb } from "antd";
import { NavLink } from "react-router-dom";

 const Classification = ({ path, maxLength }) => 
 <Breadcrumb separator=">">
        {!maxLength && path.reverse().map(taxon => {
          return (
            <Breadcrumb.Item key={taxon.id}>
              <NavLink
                to={{
                  pathname: `/dataset/${taxon.datasetKey}/classification`,
                  search: `?taxonKey=${taxon.id}`
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
              </NavLink>
            </Breadcrumb.Item>
          );
        })}
        {maxLength && path.slice(0, maxLength).reverse().map(taxon => {
          return (
            <Breadcrumb.Item key={taxon.id}>
              <NavLink
                to={{
                  pathname: `/dataset/${taxon.datasetKey}/classification`,
                  search: `?taxonKey=${taxon.id}`
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
              </NavLink>
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>

export default Classification
    
    
