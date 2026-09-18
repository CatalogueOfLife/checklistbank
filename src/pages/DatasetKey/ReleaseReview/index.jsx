import { useState, useEffect, useCallback } from "react";
import { Alert, Row, Spin, Tabs } from "antd";
import { NavLink } from "react-router-dom";
import axios from "axios";
import qs from "query-string";
import _ from "lodash";
import config from "../../../config";
import history from "../../../history";
import PageContent from "../../../components/PageContent";
import { getDatasetsBatch } from "../../../api/dataset";
import { formatTime } from "../../../dateTime";
import { DIFF_ROOT } from "./links";
import LinksTab from "./LinksTab";
import IssuesTab from "./IssuesTab";
import SectorsTab from "./SectorsTab";
import AiReviewTab from "./AiReviewTab";

const label = (d, key) =>
  d ? `${d.alias || d.title || key} (#${key})` : `#${key}`;

/**
 * Review of a release against the last published release of the same kind.
 *
 * Which release that is, and the state of the AI review, both come from the
 * backend's /dataset/{key}/review - the UI never guesses the predecessor.
 */
// The predecessor as the backend defines it (same kind, published, next lower
// key), for a backend that does not serve the review endpoint yet.
const findPreviousRelease = (datasetKey, dataset) => {
  if (!dataset?.sourceKey || !dataset?.origin) return Promise.resolve(null);
  return axios(
    `${config.dataApi}dataset?${qs.stringify({
      releasedFrom: dataset.sourceKey,
      origin: dataset.origin,
      sortBy: "key",
      reverse: true,
      private: false,
      limit: 100,
    })}`
  )
    .then(
      (res) =>
        (res.data?.result || [])
          .map((d) => d.key)
          .find((k) => k < Number(datasetKey)) ?? null
    )
    .catch(() => null);
};

const ReleaseReview = ({ datasetKey, dataset, location }) => {
  const [review, setReview] = useState(null);
  const [previousReleaseKey, setPreviousReleaseKey] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [diffRoot, setDiffRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getReview = useCallback(
    () =>
      axios(`${config.dataApi}dataset/${datasetKey}/review`)
        .then((res) => {
          setReview(res.data);
          setError(null);
          return res.data;
        })
        .catch((err) => {
          setError(err);
          return null;
        }),
    [datasetKey]
  );

  useEffect(() => {
    setLoading(true);
    setReview(null);
    setPreviousReleaseKey(null);
    setPrevious(null);
    setDiffRoot(null);
    getReview()
      .then((data) =>
        data?.previousReleaseKey ??
        findPreviousRelease(datasetKey, dataset)
      )
      .then((prevKey) => {
        if (!prevKey) return;
        setPreviousReleaseKey(prevKey);
        getDatasetsBatch([prevKey]).then((datasets) =>
          setPrevious(_.get(datasets, "[0]"))
        );
        // The COL root taxon is meaningless in other projects, so only root the
        // names diff when both releases actually carry it.
        Promise.all(
          [datasetKey, prevKey].map((k) =>
            axios(`${config.dataApi}dataset/${k}/taxon/${DIFF_ROOT}`)
              .then(() => true)
              .catch(() => false)
          )
        ).then(([a, b]) => setDiffRoot(a && b ? DIFF_ROOT : null));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey, getReview]);
  const activeKey = qs.parse(location?.search)?.tab || "links";
  const onTabChange = (tab) =>
    history.push({
      pathname: location.pathname,
      search: qs.stringify({ ...qs.parse(location.search), tab }),
    });

  const comparisonTab = (children) =>
    previousReleaseKey ? (
      children
    ) : (
      <Alert
        title="There is no previous published release of this kind to compare against."
        type="info"
      />
    );

  return (
    <PageContent>
      {loading ? (
        <Row justify="center" style={{ marginTop: "24px" }}>
          <Spin size="large" />
        </Row>
      ) : (
        <>
          <p>
            Reviewing {label(dataset, datasetKey)}
            {dataset?.attempt ? `, release #${dataset.attempt}` : ""}
            {dataset?.issued ? `, issued ${formatTime(dataset.issued, "LL")}` : ""}
            {previousReleaseKey ? (
              <>
                {" "}
                against{" "}
                <NavLink to={{ pathname: `/dataset/${previousReleaseKey}` }}>
                  {label(previous, previousReleaseKey)}
                </NavLink>
                {previous?.issued
                  ? `, issued ${formatTime(previous.issued, "LL")}`
                  : ""}
                .
              </>
            ) : (
              "."
            )}
          </p>
          <Tabs
            activeKey={activeKey}
            onChange={onTabChange}
            items={[
              {
                key: "links",
                label: "Links",
                children: comparisonTab(
                  <LinksTab
                    datasetKey={datasetKey}
                    previousReleaseKey={previousReleaseKey}
                    diffRoot={diffRoot}
                    dataset={dataset}
                  />
                ),
              },
              {
                key: "issues",
                label: "Issues",
                children: comparisonTab(
                  <IssuesTab
                    datasetKey={datasetKey}
                    previousReleaseKey={previousReleaseKey}
                  />
                ),
              },
              {
                key: "sectors",
                label: "Sectors",
                children: comparisonTab(
                  <SectorsTab
                    datasetKey={datasetKey}
                    previousReleaseKey={previousReleaseKey}
                    dataset={dataset}
                  />
                ),
              },
              {
                key: "ai",
                label: "Claude AI",
                children: (
                  <AiReviewTab
                    datasetKey={datasetKey}
                    review={review}
                    loadError={error}
                    reload={getReview}
                    dataset={dataset}
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </PageContent>
  );
};

export default ReleaseReview;
