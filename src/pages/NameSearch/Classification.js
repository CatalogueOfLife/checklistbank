import React from "react";
import {Link} from "react-router-dom"

export default ({classification, datasetKey, catalogueKey, maxParents = classification.length}) => {
    const clazzification = classification.slice(Math.max(classification.length - maxParents));
    
    return clazzification.map((t, key) => 
    <React.Fragment>
        <Link to={`/catalogue/${catalogueKey}/dataset/${datasetKey}/taxon/${t.id}`}>{t.name}</Link>
        {!Object.is(clazzification.length - 1, key) && " > "}
    </React.Fragment>)}