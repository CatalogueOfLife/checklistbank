import React from "react";
import PageContent from "../../components/PageContent";
import VerbatimPresentation from "../../components/VerbatimPresentation";

const VerbatimByID = props => (
  <PageContent>
    <VerbatimPresentation 
   {...props}
   />
  </PageContent>
);

export default VerbatimByID
