import React from "react";
import { Breadcrumb } from "antd";
import { NavLink } from "react-router-dom";

 const Classification = ({ path, maxLength, datasetKey, catalogueKey }) => 
 <Breadcrumb separator=">">
        {!maxLength && path.reverse().map(taxon => {
          return (
            <Breadcrumb.Item key={taxon.id}>
              <NavLink
                to={{
                  pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/classification`,
                  search: `?sourceTaxonKey=${taxon.id}`
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
                  pathname: `/catalogue/${catalogueKey}/dataset/${datasetKey}/classification`,
                  search: `?sourceTaxonKey=${taxon.id}`
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
              </NavLink>
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>

export default Classification
    
    
