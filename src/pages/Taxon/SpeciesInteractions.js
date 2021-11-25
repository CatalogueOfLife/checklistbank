import React from "react";
import _ from "lodash";
import withContext from "../../components/hoc/withContext";

const SpeciesInterActions = ({
  speciesInteractions,
  scientificName,
  speciesinteractiontype,
}) =>
  speciesInteractions
    .map((i) => `${i.relatedTaxonScientificName} (${i.type} ${scientificName})`)
    .join(", ");

const mapContextToProps = ({ speciesinteractiontype }) => ({
  speciesinteractiontype,
});

export default withContext(mapContextToProps)(SpeciesInterActions);
