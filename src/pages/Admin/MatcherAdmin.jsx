import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import {
  Alert,
  Row,
  Col,
  Button,
  Popconfirm,
  Descriptions,
  Tag,
  Spin,
  Empty,
  App,
} from "antd";
import config from "../../config";
import Layout from "../../components/LayoutNew";
import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";

import withContext from "../../components/hoc/withContext";

// Matchers only exist for published, non-deleted external datasets and releases — never projects.
const MATCHER_ORIGINS = ["external", "release", "xrelease"];

const MatcherAdmin = () => {
  const { notification } = App.useApp();
  const [error, setError] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  // Threshold (number of usages) below which datasets get a Postgres-backed matcher and no
  // persistent file. Fetched from the backend so the picker only offers datasets that have one.
  const [threshold, setThreshold] = useState(null);

  useEffect(() => {
    axios(`${config.dataApi}matcher`)
      .then((res) => setThreshold(res.data?.pgMatcherThreshold ?? null))
      .catch(() => setThreshold(null));
  }, []);

  const loadMetadata = (key) => {
    setLoading(true);
    setMetadata(null);
    axios(`${config.dataApi}matcher/${key}`)
      .then((res) => {
        setMetadata(res.data || null);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setMetadata(null);
      })
      .finally(() => setLoading(false));
  };

  const onSelectDataset = (d) => {
    const record = d?.data || d;
    setDataset(record);
    if (record?.key) {
      loadMetadata(record.key);
    }
  };

  const onResetSearch = () => {
    setDataset(null);
    setMetadata(null);
  };

  const rebuildDataset = (datasetKey) => {
    axios
      .post(`${config.dataApi}matcher/${datasetKey}`)
      .then(() => {
        setError(null);
        notification.open({
          message: "Matcher build started",
          description: `Matcher for dataset ${datasetKey} is being rebuilt`,
        });
      })
      .catch((err) => setError(err));
  };

  const rebuildAll = (force) => {
    axios
      .post(`${config.dataApi}matcher/rebuild?force=${force}`)
      .then(() => {
        setError(null);
        notification.open({
          message: "Rebuild triggered",
          description: force
            ? "All matchers are being rebuilt"
            : "Stale matchers are being rebuilt",
        });
      })
      .catch((err) => setError(err));
  };

  // A matcher is stale when its stored attempt differs from the dataset's current import attempt.
  const stale =
    metadata != null &&
    dataset?.attempt != null &&
    metadata.attempt !== dataset.attempt;

  return (
    <Layout
      openKeys={["admin"]}
      selectedKeys={["MatcherAdmin"]}
      title="Matcher Admin"
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 140,
          margin: "16px 0",
        }}
      >
        {error && (
          <Alert
            message={error.message}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        <h1>Dataset Matcher</h1>
        <p>
          Dataset matchers are file based indices of a dataset used for
          db independent matching services. Every published external dataset and
          release has a matcher; projects do not.
          {threshold > 0 && (
            <>
              {" "}
              Datasets with fewer than {threshold.toLocaleString()} usages are
              matched directly against Postgres and have no persistent matcher,
              so they are excluded from the search below.
            </>
          )}
        </p>

        <Row gutter={8} align="bottom" style={{ marginBottom: 16 }}>
          <Col flex="auto" style={{ maxWidth: 500 }}>
            <DatasetAutocomplete
              defaultDatasetKey={dataset?.key || null}
              origin={MATCHER_ORIGINS}
              minSize={threshold || undefined}
              onResetSearch={onResetSearch}
              onSelectDataset={onSelectDataset}
              onError={(err) => setError(err)}
              placeHolder="Find a dataset to inspect its matcher"
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <Popconfirm
              title="Rebuild only stale matchers (those whose index is out of date)?"
              onConfirm={() => rebuildAll(false)}
              okText="Yes"
              cancelText="No"
            >
              <Button>Rebuild stale</Button>
            </Popconfirm>
          </Col>
          <Col>
            <Popconfirm
              title="Rebuild all matchers? This reindexes every published dataset."
              onConfirm={() => rebuildAll(true)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary">Rebuild all</Button>
            </Popconfirm>
          </Col>
        </Row>

        {dataset && (
          <Spin spinning={loading}>
            {metadata ? (
              <Descriptions
                bordered
                size="middle"
                column={1}
                style={{ marginTop: 16 }}
                extra={
                  <Button
                    type="primary"
                    onClick={() => rebuildDataset(dataset.key)}
                  >
                    Rebuild
                  </Button>
                }
              >
                <Descriptions.Item label="Dataset">
                  <NavLink to={{ pathname: `/dataset/${dataset.key}/names` }} end>
                    {dataset.alias || dataset.title} [{dataset.key}]
                  </NavLink>
                </Descriptions.Item>
                <Descriptions.Item label="Origin">
                  {dataset.origin}
                </Descriptions.Item>
                <Descriptions.Item label="Index size">
                  {metadata.size != null ? metadata.size.toLocaleString() : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Matcher attempt">
                  {metadata.attempt ?? "—"}
                </Descriptions.Item>
                {dataset.attempt != null && (
                  <Descriptions.Item label="Current attempt">
                    {dataset.attempt}{" "}
                    {stale ? (
                      <Tag color="orange">stale</Tag>
                    ) : (
                      <Tag color="green">up to date</Tag>
                    )}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              !loading && (
                <Empty
                  style={{ marginTop: 16 }}
                  description={
                    <span>
                      No matcher loaded for{" "}
                      <NavLink
                        to={{ pathname: `/dataset/${dataset.key}/names` }}
                        end
                      >
                        {dataset.alias || dataset.title} [{dataset.key}]
                      </NavLink>
                    </span>
                  }
                >
                  <Button
                    type="primary"
                    onClick={() => rebuildDataset(dataset.key)}
                  >
                    Build matcher
                  </Button>
                </Empty>
              )
            )}
          </Spin>
        )}
      </div>
    </Layout>
  );
};

const mapContextToProps = ({ user }) => ({
  user,
});

export default withContext(mapContextToProps)(MatcherAdmin);
