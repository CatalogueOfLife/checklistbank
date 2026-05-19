import { useEffect, useRef } from "react";
import withContext from "./withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withRouter from "../../withRouter";

const DatasetProvider = ({
  match,
  dataset,
  catalogue,
  setCatalogue,
  setDataset,
  setSourceDataset,
  setRecentDatasets,
  addError,
}) => {
  const loadingRef = useRef(false);
  const catalogueLoadingRef = useRef(false);

  const fetchDataset = (key) => {
    loadingRef.current = true;
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => {
        return axios(
          `${config.dataApi}dataset?limit=1000&hasSourceDataset=${key}&origin=PROJECT`
        ).then((projects) => {
          if (_.get(projects, "data.result")) {
            res.data.contributesTo = projects.data.result.map((r) => r.key);
          }
          return res;
        });
      })
      .then((res) => {
        loadingRef.current = false;

        const recentDatasetsAsText = localStorage.getItem(
          "colplus_recent_datasets"
        );
        let recentDatasets = recentDatasetsAsText
          ? JSON.parse(recentDatasetsAsText)
          : [];
        recentDatasets.unshift(res.data);
        recentDatasets = _.uniqBy(recentDatasets, "key")
          .slice(0, 5)
          .map((d) => ({ key: d?.key, title: d?.title, alias: d?.alias }));
        localStorage.setItem(
          "colplus_recent_datasets",
          JSON.stringify(recentDatasets)
        );
        setRecentDatasets(recentDatasets);
        setDataset(res.data);
        if (res?.data?.origin === "project") {
          setCatalogue(res.data);
        } else {
          setCatalogue(null);
        }
      })
      .catch((err) => {
        loadingRef.current = false;

        const recentDatasetsAsText = localStorage.getItem(
          "colplus_recent_datasets"
        );
        let recentDatasets = recentDatasetsAsText
          ? JSON.parse(recentDatasetsAsText)
          : [];
        recentDatasets = recentDatasets
          .filter((d) => d.key !== key)
          .map((d) => ({ key: d?.key, title: d?.title, alias: d?.alias }));
        localStorage.setItem(
          "colplus_recent_datasets",
          JSON.stringify(recentDatasets)
        );
        localStorage.removeItem("col_selected_dataset");

        addError(err);
      });
  };

  const fetchCatalogue = (key) => {
    catalogueLoadingRef.current = true;
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => {
        catalogueLoadingRef.current = false;
        setCatalogue(res.data);
        setSourceDataset(null);
        setDataset(null);
      })
      .catch((err) => {
        catalogueLoadingRef.current = false;
        addError(err);
      });
  };

  const key = _.get(match, "params.key");
  const projectKey = _.get(match, "params.projectKey");

  // Mount
  useEffect(() => {
    if (key && key !== _.get(dataset, "key")) {
      fetchDataset(key);
    }
    if (
      projectKey &&
      Number(projectKey) !== Number(_.get(catalogue, "key"))
    ) {
      fetchCatalogue(projectKey);
    }
  }, []);

  // key changes
  useEffect(() => {
    if (key && !loadingRef.current) {
      fetchDataset(key);
    }
  }, [key]);

  // projectKey changes
  useEffect(() => {
    if (projectKey && !catalogueLoadingRef.current) {
      fetchCatalogue(projectKey);
    }
  }, [projectKey]);

  return null;
};

const mapContextToProps = ({
  catalogue,
  setCatalogue,
  dataset,
  setDataset,
  setSourceDataset,
  setRecentDatasets,
  addError,
}) => ({
  dataset,
  setDataset,
  setSourceDataset,
  addError,
  setRecentDatasets,
  catalogue,
  setCatalogue,
});

export default withContext(mapContextToProps)(withRouter(DatasetProvider));
