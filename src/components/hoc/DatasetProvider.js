import { useEffect, useLayoutEffect } from "react";
import withContext from "./withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withRouter from "../../withRouter";
import { getDatasetsBatch } from "../../api/dataset";
import { datasetMatchesRoute } from "../util/datasetRouteMatch";

/**
 * Keeps the AppContext `dataset` / `project` in step with the URL.
 *
 * Invariant: context `dataset` is the *simple* record - identity only. Never
 * derive a request key from it; take that from the route. Never assume the
 * heavy fields are present. DatasetMeta upgrades it to the full record when you
 * visit the metadata page, so extra fields *may* be there, but never *will* be.
 *
 * Two rules make that safe:
 *  - the held dataset is dropped the moment the route names a different one,
 *    so no consumer can ever read a dataset belonging to another URL;
 *  - identity comes from /dataset/simple (~85ms) rather than the full record
 *    (~4-20s on dev), so the gap where there is no dataset at all is short.
 */
const DatasetProvider = ({
  match,
  dataset,
  project,
  setProject,
  setDataset,
  setSourceDataset,
  setRecentDatasets,
  addError,
}) => {
  const key = _.get(match, "params.key");
  const projectKey = _.get(match, "params.projectKey");

  // Drop a dataset that belongs to a different URL, before anything is painted.
  // `dataset` survives navigation and is seeded from localStorage at startup, so
  // without this it lingers for the length of the fetch - long enough to submit
  // an export against the previously visited dataset.
  //
  // Keyed on [key] alone on purpose: this must fire when the route changes, and
  // never when a fetch lands. Conditional on purpose too - reloading the *same*
  // dataset keeps the localStorage seed, which is the case the seed exists for.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!key) return;
    if (dataset && !datasetMatchesRoute(dataset, key)) {
      setDataset(null);
    }
  }, [key]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!projectKey) return;
    if (project && !datasetMatchesRoute(project, projectKey)) {
      setProject(null);
    }
  }, [projectKey]);

  // Source / release / external dataset fetch (URL: /dataset/:key/*)
  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    // Both are fast and independent of each other, so they run together. The
    // projects query only ever needed `key`, not the dataset record.
    Promise.all([
      getDatasetsBatch([key]),
      axios(
        `${config.dataApi}dataset?limit=1000&hasSourceDataset=${key}&origin=PROJECT`
      ),
    ])
      .then(([datasets, projects]) => {
        if (cancelled) return;

        const data = datasets?.[0];
        // getDatasetsBatch resolves with null instead of rejecting, so an
        // unknown or inaccessible key arrives here rather than in .catch - it
        // still has to run the not-found cleanup below.
        if (!data) {
          throw new Error(`Dataset ${key} does not exist`);
        }
        // A late response must never reintroduce a mismatch.
        if (!datasetMatchesRoute(data, key)) return;

        if (_.get(projects, "data.result")) {
          data.contributesTo = projects.data.result.map((r) => r.key);
        }

        const recentDatasetsAsText = localStorage.getItem(
          "colplus_recent_datasets"
        );
        let recentDatasets = recentDatasetsAsText
          ? JSON.parse(recentDatasetsAsText)
          : [];
        recentDatasets.unshift(data);
        recentDatasets = _.uniqBy(recentDatasets, "key")
          .slice(0, 5)
          .map((d) => ({ key: d?.key, title: d?.title, alias: d?.alias }));
        localStorage.setItem(
          "colplus_recent_datasets",
          JSON.stringify(recentDatasets)
        );
        setRecentDatasets(recentDatasets);
        setDataset(data);
        if (data.origin === "project") {
          setProject(data);
        } else {
          setProject(null);
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

  // Project fetch (URL: /project/:projectKey/*)
  useEffect(() => {
    if (!projectKey) return;
    let cancelled = false;

    axios(`${config.dataApi}dataset/${projectKey}`)
      .then((res) => {
        if (cancelled) return;
        if (!datasetMatchesRoute(res.data, projectKey)) return;
        setProject(res.data);
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
  dataset,
  project,
  setProject,
  setDataset,
  setSourceDataset,
  setRecentDatasets,
  addError,
}) => ({
  dataset,
  project,
  setDataset,
  setSourceDataset,
  addError,
  setRecentDatasets,
  setProject,
});

export default withContext(mapContextToProps)(withRouter(DatasetProvider));
