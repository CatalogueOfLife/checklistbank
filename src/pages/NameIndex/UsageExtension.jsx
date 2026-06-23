import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Table, Button, Row, Col, Space, Tooltip, Image, Empty, Card, Typography } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import withContext from "../../components/hoc/withContext";
import axios from "axios";
import config from "../../config";
import { getDatasetsBatch } from "../../api/dataset";
import { truncate } from "../../components/util";
import DataLoader from "dataloader";
import _ from "lodash";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
// The service returns a plain list with no total count, so we fix the page
// size at 100 and infer whether a further page exists from whether the page
// came back full.
const PAGE_SIZE = 100;

const decorateWithDataset = (rows) =>
  Promise.all(
    rows.map((row) =>
      datasetLoader.load(row.datasetKey).then((dataset) => {
        row.dataset = dataset;
        return row;
      })
    )
  );

// Gallery thumbnail: serve a resized, cached copy from the GBIF image cache,
// but fall back to the original URL if the cache can't fetch it (e.g. Wikimedia
// Special:FilePath URLs redirect and the proxy 404s on them). The zoom preview
// always uses the full-size original.
const CachedImage = ({ url, title }) => {
  const cached = `https://api.gbif.org/v1/image/unsafe/x360/${url}`;
  const [src, setSrc] = useState(cached);
  return (
    <Image
      src={src}
      preview={{ src: url }}
      alt={title || ""}
      height={180}
      style={{ objectFit: "cover" }}
      onError={() => {
        if (src !== url) setSrc(url);
      }}
    />
  );
};

// Link to the actual usage in the source dataset when the record carries a
// taxonID, otherwise fall back to the dataset itself.
const usagePath = (record) =>
  record.taxonID != null
    ? `/dataset/${record.datasetKey}/taxon/${encodeURIComponent(record.taxonID)}`
    : `/dataset/${record.datasetKey}`;

// Shared Dataset column linking to the usage in the source dataset.
const datasetColumn = {
  title: "Dataset",
  dataIndex: ["dataset", "title"],
  key: "dataset",
  width: 220,
  render: (text, record) => (
    <NavLink to={{ pathname: usagePath(record) }} end>
      <Tooltip title={text}>
        {truncate(text, 28)}
        {record?.dataset?.version ? ` [${record.dataset.version}]` : ""}
      </Tooltip>
    </NavLink>
  ),
};

const UsageExtension = ({
  nidxKey,
  endpoint,
  columns,
  gallery = false,
  description,
  addError,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  // Reset paging when the entry changes.
  useEffect(() => {
    setOffset(0);
  }, [nidxKey, endpoint]);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const res = await axios(
          `${config.dataApi}nameusage/${endpoint}?nidx=${nidxKey}&offset=${offset}&limit=${PAGE_SIZE}`
        );
        const rows = res?.data || [];
        await decorateWithDataset(rows);
        // No total is returned: a full page means there may be more.
        setHasNext(rows.length === PAGE_SIZE);
        setItems(rows);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        addError(err);
      }
    };
    getData();
  }, [nidxKey, endpoint, offset]);

  const pager = (
    <Row style={{ marginTop: "10px" }} align="middle">
      <Col flex="auto">
        {items.length > 0 &&
          `Showing ${(offset + 1).toLocaleString()} – ${(
            offset + items.length
          ).toLocaleString()}`}
      </Col>
      <Col>
        <Space>
          <Button
            icon={<LeftOutlined />}
            disabled={offset <= 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Previous
          </Button>
          <span>Page {(Math.floor(offset / PAGE_SIZE) + 1).toLocaleString()}</span>
          <Button
            disabled={!hasNext || loading}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next <RightOutlined />
          </Button>
        </Space>
      </Col>
    </Row>
  );

  if (gallery) {
    return (
      <>
        {description && (
          <Typography.Paragraph type="secondary">
            {description}
          </Typography.Paragraph>
        )}
        {items.length === 0 && !loading ? (
          <Empty />
        ) : (
          <Image.PreviewGroup>
            <Row gutter={[16, 16]}>
              {items.map((m) => (
                <Col key={`${m.datasetKey}_${m.id}`}>
                  <Card
                    size="small"
                    style={{ width: 220 }}
                    styles={{ body: { padding: "8px" } }}
                    cover={
                      m.type === "image" && m.url ? (
                        <CachedImage url={m.url} title={m.title} />
                      ) : null
                    }
                  >
                    <Card.Meta
                      title={
                        m.link ? (
                          <a href={m.link} target="_blank" rel="noreferrer">
                            <Tooltip title={m.title}>
                              {truncate(m.title || m.url, 30)}
                            </Tooltip>
                          </a>
                        ) : (
                          <Tooltip title={m.title}>
                            {truncate(m.title || m.url, 30)}
                          </Tooltip>
                        )
                      }
                      description={
                        <>
                          <NavLink to={{ pathname: usagePath(m) }} end>
                            {truncate(m?.dataset?.title, 28)}
                          </NavLink>
                          {m.capturedBy && (
                            <div style={{ fontSize: "11px", color: "#999" }}>
                              {truncate(m.capturedBy, 32)}
                            </div>
                          )}
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Image.PreviewGroup>
        )}
        {pager}
      </>
    );
  }

  return (
    <>
      {description && (
        <Typography.Paragraph type="secondary">
          {description}
        </Typography.Paragraph>
      )}
      <Table
        size="small"
        columns={[datasetColumn, ...columns]}
        dataSource={items}
        loading={loading}
        rowKey={(record) => `${record.datasetKey}_${record.id}`}
        pagination={false}
        expandable={{
          expandedRowRender: (record) => (
            // `dataset` is augmented client-side for the Dataset column; the
            // verbatimKey and audit fields are noise here. Omit them so the
            // expanded JSON shows only the meaningful record content.
            <pre>
              {JSON.stringify(
                _.omit(record, [
                  "dataset",
                  "verbatimKey",
                  "created",
                  "createdBy",
                  "modified",
                  "modifiedBy",
                ]),
                null,
                2
              )}
            </pre>
          ),
        }}
      />
      {pager}
    </>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(UsageExtension);
