import React, { useEffect, useState } from "react";
import {
  Empty,
  Row,
  Col,
  Select,
  Popconfirm,
  Checkbox,
  Tag,
  Spin,
  Button,
  Tooltip,
  Divider,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import _ from "lodash";
import qs from "query-string";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import NamesDiffView from "../../../components/NamesDiffView";
import NameAutocomplete from "../../project/Assembly/NameAutocomplete";

// The names diff step of the dataset comparison. Datasets are chosen in the
// first step; here the user can add further root taxa per dataset (kept in
// the URL as repeated root / root2 params) and runs the diff on demand.
const NamesDiffStep = ({
  location,
  updateSearch,
  datasetKey1,
  datasetKey2,
  dataset1,
  dataset2,
  addError,
  rank,
}) => {
  const [diffData, setDiffData] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [root, setRoot] = useState([]);
  const [root2, setRoot2] = useState([]);
  const [minRank, setMinRank] = useState(null);
  const [rankFilter, setRankFilter] = useState(null);
  const [synonyms, setSynonyms] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const [parentRank, setParentRank] = useState("");
  const [authorship, setAuthorship] = useState(true);

  const clearResult = () => {
    setDiffData(null);
    setEmpty(false);
    setDownloadUrl(null);
  };

  // A diff never outlives the selection it was made for. Dataset keys come
  // from the URL too: the parent only fills its dataset state after mount.
  useEffect(() => {
    const params = qs.parse(location.search);
    clearResult();
    decorateRoots(params.root, params.dataset).then(setRoot);
    decorateRoots(params.root2, params.dataset2).then(setRoot2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Revoke the previous JSON download URL whenever it is replaced or dropped.
  useEffect(
    () => () => {
      if (downloadUrl) window.URL.revokeObjectURL(downloadUrl);
    },
    [downloadUrl]
  );

  const decorate = async (id, datasetKey_) => {
    const { data } = await axios(
      `${config.dataApi}dataset/${datasetKey_}/taxon/${encodeURIComponent(id)}`
    );
    const {
      data: { total },
    } = await axios(
      `${config.dataApi}dataset/${datasetKey_}/nameusage/search?TAXON_ID=${encodeURIComponent(id)}&limit=0`
    );
    return {
      key: data.id,
      title: _.get(data, "name.scientificName"),
      total,
    };
  };

  const decorateRoots = async (roots, datasetKey_) => {
    if (!roots || !datasetKey_) return [];
    try {
      return await Promise.all(
        _.castArray(roots).map((r) => decorate(r, datasetKey_))
      );
    } catch (err) {
      addError(err);
      return [];
    }
  };

  const resetOptions = () => {
    clearResult();
    setMinRank(null);
    setRankFilter(null);
    setSynonyms(false);
    setShowParent(false);
    setParentRank("");
    setAuthorship(true);
  };

  const getData = async () => {
    // Unset options must be left out entirely: an empty rankFilter param
    // filters out every rank and yields an empty diff.
    const search = qs.stringify(
      _.omitBy(
        {
          root: root.map((t) => t.key),
          root2: root2.map((t) => t.key),
          minRank,
          rankFilter,
          synonyms: synonyms || null,
          showParent: showParent || null,
          parentRank: showParent ? parentRank : null,
          authorship: authorship ? null : false,
        },
        _.isNil
      )
    );
    clearResult();
    setLoading(true);
    try {
      const { data } = await axios(
        `${config.dataApi}dataset/${datasetKey1}/diff/${datasetKey2}?${search}`
      );
      const isEmpty =
        !data ||
        data.identical ||
        ((data.removed?.length ?? 0) === 0 &&
          (data.added?.length ?? 0) === 0 &&
          (data.changed?.length ?? 0) === 0);
      setEmpty(isEmpty);
      setDiffData(data);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      setDownloadUrl(window.URL.createObjectURL(blob));
    } catch (error) {
      addError(error);
    }
    setLoading(false);
  };

  const rankOptions = (rank || []).map((r) => ({ value: r, label: r }));

  const rootColumn = (param, roots, datasetKey, dataset, placeholder) => (
    <>
      <Divider titlePlacement="left" plain>
        {dataset?.alias || dataset?.title || `Dataset ${datasetKey}`}
      </Divider>
      <div style={{ marginBottom: "8px" }}>
        <NameAutocomplete
          minRank="GENUS"
          datasetKey={datasetKey}
          onError={addError}
          placeHolder={placeholder}
          onSelectName={(name) => {
            updateSearch({
              [param]: _.uniq([...roots.map((tx) => tx.key), name.key]),
            });
          }}
          onResetSearch={() => {}}
        />
      </div>
      {roots.length > 0 && (
        <>
          <span className="small-text">Selected root(s): </span>
          {roots.map((t) => (
            <Tag
              key={t.key}
              closable
              onClose={() => {
                updateSearch({
                  [param]: roots
                    .filter((tx) => tx.key !== t.key)
                    .map((tx) => tx.key),
                });
              }}
            >
              {t.title} {t?.total ? `(${t.total.toLocaleString()})` : ""}
            </Tag>
          ))}
        </>
      )}
    </>
  );

  return (
    <>
      <Row style={{ marginBottom: "8px" }} gutter={[12, 8]} align="middle">
        <Col>
          <Checkbox
            checked={showParent}
            onChange={(e) => setShowParent(e.target.checked)}
          >
            Show parent
          </Checkbox>
          <Select
            value={parentRank}
            onChange={setParentRank}
            placeholder="Select parent rank"
            allowClear
            showSearch
            disabled={!showParent}
            style={{ width: "140px" }}
            options={[{ value: "", label: "Direct parent" }, ...rankOptions]}
          />
        </Col>
        <Col>
          <Select
            value={minRank}
            onChange={setMinRank}
            placeholder="Select min rank"
            allowClear
            showSearch
            style={{ width: "200px" }}
            options={rankOptions}
          />
        </Col>
        <Col>
          <Select
            value={rankFilter}
            onChange={setRankFilter}
            placeholder="Rank filter"
            allowClear
            showSearch
            style={{ width: "200px" }}
            options={rankOptions}
          />
        </Col>
        <Col>
          Include:{" "}
          <Checkbox
            checked={authorship}
            onChange={(e) => setAuthorship(e.target.checked)}
          >
            Authorship
          </Checkbox>
          <Checkbox
            checked={synonyms}
            onChange={(e) => setSynonyms(e.target.checked)}
          >
            Synonyms
          </Checkbox>
        </Col>
        <Col flex="auto"></Col>
        {downloadUrl && !empty && (
          <Col>
            <Tooltip title="Download diff as JSON">
              <Button
                disabled={loading}
                type="primary"
                href={downloadUrl}
                download={`dataset${datasetKey1}_dataset${datasetKey2}.json`}
              >
                <DownloadOutlined />
              </Button>
            </Tooltip>
          </Col>
        )}
        <Col>
          <Button danger onClick={resetOptions}>
            Reset options
          </Button>
        </Col>
        <Col>
          <Popconfirm
            disabled={root.length > 0 && root2.length > 0}
            title={
              <>
                You have not selected root taxa for both datasets, proceed
                anyways?
                <br /> This may produce very large diffs or the server may be
                overloaded.
              </>
            }
            onConfirm={getData}
            placement="leftTop"
          >
            <Button
              loading={loading}
              disabled={loading || !datasetKey1 || !datasetKey2}
              type="primary"
              onClick={() => {
                if (root.length > 0 && root2.length > 0) {
                  getData();
                }
              }}
            >
              Get diff
            </Button>
          </Popconfirm>
        </Col>
      </Row>

      <Row style={{ marginBottom: "8px" }}>
        <Col
          span={12}
          style={{
            padding: "8px",
            borderRightStyle: "solid",
            borderRightColor: "rgba(0, 0, 0, 0.06)",
            borderRightWidth: "1px",
          }}
        >
          {rootColumn("root", root, datasetKey1, dataset1, "Add root taxon")}
        </Col>
        <Col span={12} style={{ padding: "8px" }}>
          {rootColumn("root2", root2, datasetKey2, dataset2, "Add root taxon")}
        </Col>
      </Row>

      {diffData && !empty && <NamesDiffView diff={diffData} />}
      {empty && <Empty description="No diff" />}
      {loading && (
        <Row style={{ marginTop: "40px" }} justify="center">
          <Spin size="large" />
        </Row>
      )}
    </>
  );
};

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });

export default withContext(mapContextToProps)(NamesDiffStep);
