import { useEffect } from "react";
import withContext from "./withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withRouter from "../../withRouter";

const DatasetProvider = ({
  match,
  setCatalogue,
  setDataset,
  setSourceDataset,
  setRecentDatasets,
  addError,
}) => {
  const key = _.get(match, "params.key");
  const projectKey = _.get(match, "params.projectKey");

  // Source / release / external dataset fetch (URL: /dataset/:key/*)
  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    axios(`${config.dataApi}dataset/${key}`)
      .then((res) =>
        axios(
          `${config.dataApi}dataset?limit=1000&hasSourceDataset=${key}&origin=PROJECT`
        ).then((projects) => {
          if (_.get(projects, "data.result")) {
            res.data.contributesTo = projects.data.result.map((r) => r.key);
          }
          return res;
        })
      )
      .then((res) => {
        if (cancelled) return;

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
        if (cancelled) return;

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

    return () => {
      cancelled = true;
    };
  }, [key]);

  // Project (a.k.a. "catalogue") fetch (URL: /project/:projectKey/*)
  useEffect(() => {
    if (!projectKey) return;
    let cancelled = false;

    axios(`${config.dataApi}dataset/${projectKey}`)
      .then((res) => {
        if (cancelled) return;
        setCatalogue(res.data);
        setSourceDataset(null);
        setDataset(null);
      })
      .catch((err) => {
        if (cancelled) return;
        addError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [projectKey]);

  return null;
};

const mapContextToProps = ({
  setCatalogue,
  setDataset,
  setSourceDataset,
  setRecentDatasets,
  addError,
}) => ({
  setDataset,
  setSourceDataset,
  addError,
  setRecentDatasets,
  setCatalogue,
});

export default withContext(mapContextToProps)(withRouter(DatasetProvider));
