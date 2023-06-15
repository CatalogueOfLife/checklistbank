import React, { useState, useEffect } from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

const SecondarySources = ({
    info
}) => {

    const [datasets, setDatasets] = useState({})

    useEffect(() => {
        if (info?.source?.secondarySources) {
            getDatasets()
        }

    }, [info])

    useEffect(() => { }, [datasets])

    const getDatasets = async () => {

        let data = {}
        await Promise.all(Object.keys(info?.source?.secondarySources || {}).map((key) =>
            datasetLoader
                .load(info?.source?.secondarySources[key].datasetKey)
                .then((dataset) => (data[dataset.key] = dataset))
        ))
        setDatasets(data)

    }

    return info?.source?.secondarySources ?
        Object.keys(info?.source?.secondarySources || {}).map((key) =>
            <>{_.startCase(key)}: <NavLink key={key} to={{
                pathname: `/dataset/${info?.source?.secondarySources?.[key]?.datasetKey}/taxon/${info?.source?.secondarySources?.[key]?.id}`
            }}>
                {datasets[info?.source?.secondarySources?.[key]?.datasetKey]?.title + " "}
            </NavLink></>)
        : null;
};

export default SecondarySources;
