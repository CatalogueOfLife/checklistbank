import React from "react";
import {Link} from "react-router-dom"

export default ({classification, datasetKey}) => classification.map((t, key) => 
    <React.Fragment>
        <Link to={`/dataset/${datasetKey}/taxon/${t.id}`}>{t.name}</Link>
        {!Object.is(classification.length - 1, key) && " > "}
    </React.Fragment>)