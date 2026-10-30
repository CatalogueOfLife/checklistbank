import React, { useState, useEffect } from "react";
import _ from "lodash";
import axios from "axios";
import { NavLink } from "react-router-dom";
import config from "../../config";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

// A secondary source points to a name usage, but sources for the published in
// group are often bare names without any usage. Those only have a name page,
// so resolve whether the usage exists and fall back to the name otherwise.
const entityLoader = new DataLoader(
  (srcs) =>
    Promise.all(
      srcs.map((src) =>
        axios
          .get(
            `${config.dataApi}dataset/${src.datasetKey}/nameusage/${encodeURIComponent(
              src.id
            )}`
          )
          .then(() => "nameusage")
          .catch((err) => (err?.response?.status === 404 ? "name" : "nameusage"))
      )
    ),
  { cacheKeyFn: (src) => `${src.datasetKey}:${src.id}` }
);

const SecondarySources = ({ info }) => {
  const [datasets, setDatasets] = useState({});
  const [entities, setEntities] = useState({});

  useEffect(() => {
    if (info?.source?.secondarySources) {
      getDatasets();
      getEntities();
    }
  }, [info]);

  const getDatasets = async () => {
    let data = {};
    await Promise.all(
      Object.keys(info?.source?.secondarySources || {}).map((key) =>
        datasetLoader
          .load(info?.source?.secondarySources[key].datasetKey)
          .then((dataset) => (data[dataset.key] = dataset))
      )
    );
    setDatasets(data);
  };

  const getEntities = async () => {
    let data = {};
    await Promise.all(
      Object.entries(info?.source?.secondarySources || {}).map(([key, src]) =>
        entityLoader.load(src).then((entity) => (data[key] = entity))
      )
    );
    setEntities(data);
  };

  return Object.keys(info?.source?.secondarySources || {}).map((key) => {
      var src = info?.source?.secondarySources?.[key];
      var entityPath = entities[key] || "nameusage";
      return (
        <div key={key}>
          <i2>{_.startCase(key)}</i2> &nbsp;-&nbsp;&nbsp;
          <NavLink
            to={{
              pathname: `/dataset/${src?.datasetKey}/${entityPath}/${encodeURIComponent(src?.id)}`,
            }}
          >
            {datasets[src?.datasetKey]?.title + " "}
          </NavLink>
        </div>
      )
  })
};

export default SecondarySources;
