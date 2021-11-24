import React from "react";
import _ from "lodash";

const SpeciesInterActions = ({ speciesInteractions, scientificName }) =>
  speciesInteractions
    .map((i) => `${i.relatedTaxonScientificName} (${i.type} ${scientificName})`)
    .join(", ");

export default SpeciesInterActions;
