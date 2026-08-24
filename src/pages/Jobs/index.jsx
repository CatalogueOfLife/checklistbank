import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import qs from "query-string";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import Tabs from "../../components/Tabs";
import withRouter from "../../withRouter";
import history from "../../history";
import QueueTab from "./QueueTab";
import HistoryTab from "./HistoryTab";
import { applyPreset, DEFAULT_PRESET } from "./presets";

// The backend matches @QueryParam names case sensitively, so normalize the
// casing of hand typed or hand edited URLs the way DatasetList does.
const JOB_SEARCH_PARAMS = [
  "key",
  "datasetKey",
  "sectorKey",
  "createdBy",
  "status",
  "lane",
  "job",
  "priority",
  "createdAfter",
  "createdBefore",
  "limit",
  "offset",
];
const CANONICAL_PARAM_BY_LOWER = Object.fromEntries(
  JOB_SEARCH_PARAMS.map((p) => [p.toLowerCase(), p])
);

const PAGE_PARAMS = ["tab", "mine"];

export const parseSearch = (search) =>
  Object.fromEntries(
    Object.entries(qs.parse(search || "")).map(([k, v]) => [
      CANONICAL_PARAM_BY_LOWER[k.toLowerCase()] || k,
      v,
    ])
  );

/**
 * One page for every background job.
 *
 * Since backend PR #1563 imports, sector syncs, releases, exports and matching
 * share one executor, one lifecycle and one history, so the four views this
 * replaces - /imports, /admin/jobs, /jobqueue and the project sync state - are
 * just different filters over the same two endpoints.
 */
const Jobs = ({ location }) => {
  const [state, setState] = useState(() => parseSearch(location.search));

  // Keep in step with back/forward navigation and with the redirects that land
  // here from the old routes.
  useEffect(() => {
    setState(parseSearch(location.search));
  }, [location.search]);

  const tab = state.tab === "queue" ? "queue" : "history";
  const mine = state.mine === "true" || state.mine === true;
  const searchParams = Object.fromEntries(
    Object.entries(state).filter(([k]) => !PAGE_PARAMS.includes(k))
  );

  const push = (next) => {
    setState(next);
    history.push({ pathname: "/jobs", search: `?${qs.stringify(next)}` });
  };

  const updateParams = (nextSearchParams) =>
    push({
      ...nextSearchParams,
      ...(tab === "queue" ? { tab } : {}),
      ...(mine ? { mine: true } : {}),
    });

  const setTab = (key) =>
    push({ ...state, tab: key === "queue" ? "queue" : undefined });

  const setMine = (checked) =>
    push({ ...state, mine: checked ? true : undefined });

  // Landing on the history with no filters at all would page through ~7M
  // sector syncs, so start from the default preset instead.
  const historyParams =
    Object.keys(searchParams).length === 0
      ? applyPreset({}, DEFAULT_PRESET)
      : searchParams;

  const items = [
    {
      key: "queue",
      label: "Queue",
      children: <QueueTab mine={mine} setMine={setMine} />,
    },
    {
      key: "history",
      label: "History",
      children: (
        <HistoryTab params={historyParams} updateParams={updateParams} />
      ),
    },
  ];

  return (
    <Layout
      openKeys={["admin"]}
      selectedKeys={["backgroundJobs"]}
      title="Background jobs"
    >
      <Helmet>
        <title>Background jobs | ChecklistBank</title>
      </Helmet>
      <PageContent>
        <Tabs activeKey={tab} onChange={setTab} items={items} destroyOnHidden />
      </PageContent>
    </Layout>
  );
};

export default withRouter(Jobs);
