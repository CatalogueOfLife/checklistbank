import React, { useState, useEffect } from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import { getDatasetsBatch } from "../../api/dataset";
import DataLoader from "dataloader";
import { ArrowLeftOutlined } from "@ant-design/icons";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

const SecondarySources = ({ info }) => {
  const [datasets, setDatasets] = useState({});

  useEffect(() => {
    if (info?.source?.secondarySources) {
      getDatasets();
    }
  }, [info]);

  useEffect(() => { }, [datasets]);

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

  return Object.keys(info?.source?.secondarySources || {}).map((key, index) => {
      var src = info?.source?.secondarySources?.[key];
      var entityPath = src?.entity === 'name' ? 'name' : 'taxon';
      return (
        <div>
          <i2>{_.startCase(key)}</i2> &nbsp;-&nbsp;&nbsp;
          <NavLink
            key={key}
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
