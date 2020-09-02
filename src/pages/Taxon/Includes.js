import React from "react";
import _ from "lodash";
import PresentationItem from "../../components/PresentationItem";
import { NavLink } from "react-router-dom";
import withContext from "../../components/hoc/withContext";



const IncludesTable = ({ data, style, rank, datasetKey, taxon }) => (
  <div style={style}>
    {" "}
    {data
      .filter((t) => t.value !== taxon.name.rank)
      .sort((a, b) => rank.indexOf(a.value) - rank.indexOf(b.value))
      .map((t) => (
        <PresentationItem
          md={6}
          label={_.startCase(t.value)}
          classes={{ formItem: { borderBottom: "none" } }}
          key={t.value}
        >
            <NavLink
        to={{
          pathname:  `/dataset/${datasetKey}/names`,
          search: `?TAXON_ID=${taxon.id}&rank=${t.value}&status=accepted&status=provisionally%20accepted`
        }}
      >
        {t.count}
      </NavLink>
        </PresentationItem>
      ))}
  </div>
);

const mapContextToProps = ({ rank }) => ({ rank });

export default withContext(mapContextToProps)(IncludesTable);
