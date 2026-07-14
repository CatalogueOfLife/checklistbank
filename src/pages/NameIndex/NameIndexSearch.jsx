import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import { NavLink } from "react-router-dom";
import { Row, Col, Table, Select, Button, Space } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import withContext from "../../components/hoc/withContext";
import ToolHeader from "../tools/ToolHeader";
import SearchBox from "../DatasetList/SearchBox";
import axios from "axios";
import config from "../../config";
import history from "../../history";
import qs from "query-string";
import moment from "dayjs";
import _ from "lodash";

const PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = [50, 100, 500, 1000];

const columns = [
  {
    title: "Scientific Name",
    dataIndex: "scientificName",
    key: "scientificName",
    render: (text, record) => (
      <NavLink to={{ pathname: `/namesindex/${record.key}` }}>{text}</NavLink>
    ),
  },
  {
    title: "Normalized",
    dataIndex: "normalized",
    key: "normalized",
    render: (text) => (
      <span style={{ color: "rgba(0,0,0,0.45)" }}>{text}</span>
    ),
  },
  {
    title: "ID",
    dataIndex: "key",
    key: "key",
    width: 120,
    render: (text, record) => (
      <NavLink to={{ pathname: `/namesindex/${record.key}` }}>{text}</NavLink>
    ),
  },
];

const NameIndexSearch = ({ addError, location }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  // The /nidx/pattern service returns a plain list with no total count, so we
  // can't show a normal paginator. We fetch one extra row to learn whether a
  // further page exists and drive simple Previous/Next controls from that.
  const [hasNext, setHasNext] = useState(false);
  const [version, setVersion] = useState({});

  const params = qs.parse(_.get(location, "search", ""));
  const q = params.q || "";
  const limit = Number(params.limit) || PAGE_SIZE;
  const offset = Number(params.offset) || 0;
  const page = Math.floor(offset / limit) + 1;

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await axios(`${config.dataApi}nidx/metadata`);
        setVersion(data);
      } catch (error) {
        addError(error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const getData = async () => {
      if (!q) {
        setData([]);
        setHasNext(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios(
          `${config.dataApi}nidx/pattern?q=${encodeURIComponent(
            q
          )}&offset=${offset}&limit=${limit + 1}`
        );
        const rows = res?.data || [];
        setHasNext(rows.length > limit);
        setData(rows.slice(0, limit));
        setLoading(false);
      } catch (err) {
        setLoading(false);
        addError(err);
      }
    };
    getData();
  }, [location.search]);

  const updateSearch = (next) => {
    const merged = { q, limit, offset, ...next };
    const clean = _.omitBy(
      merged,
      (v) => v === null || v === undefined || v === ""
    );
    history.push({
      pathname: "/namesindex",
      search: `?${qs.stringify(clean)}`,
    });
  };

  return (
    <Layout
      title="Names Index Search"
      openKeys={["tools"]}
      selectedKeys={["nameIndexSearch"]}
    >
      <PageContent>
        <ToolHeader id="namesindex" />
        <Row gutter={[8, 8]} align="middle">
          <Col flex="auto">
            <SearchBox
              defaultValue={q || null}
              onSearch={(value) => updateSearch({ q: value || null, offset: 0 })}
            />
          </Col>
        </Row>

        {q && (
          <>
            <Table
              style={{ marginTop: "10px" }}
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="key"
              size="small"
              pagination={false}
            />
            <Row style={{ marginTop: "10px" }} align="middle">
              <Col flex="auto">
                {data.length > 0 &&
                  `Showing ${(offset + 1).toLocaleString()} – ${(
                    offset + data.length
                  ).toLocaleString()}`}
              </Col>
              <Col>
                <Space>
                  <Select
                    value={limit}
                    style={{ width: "110px" }}
                    onChange={(value) =>
                      updateSearch({ limit: value, offset: 0 })
                    }
                    options={PAGE_SIZE_OPTIONS.map((s) => ({
                      value: s,
                      label: `${s} / page`,
                    }))}
                  />
                  <Button
                    icon={<LeftOutlined />}
                    disabled={page <= 1 || loading}
                    onClick={() =>
                      updateSearch({ offset: Math.max(0, offset - limit) })
                    }
                  >
                    Previous
                  </Button>
                  <span>Page {page.toLocaleString()}</span>
                  <Button
                    disabled={!hasNext || loading}
                    onClick={() => updateSearch({ offset: offset + limit })}
                  >
                    Next <RightOutlined />
                  </Button>
                </Space>
              </Col>
            </Row>
          </>
        )}

        <Row style={{ marginTop: "16px" }}>
          <Col flex="auto"></Col>
          <Col style={{ textAlign: "right", color: "rgba(0,0,0,0.45)" }}>
            {version?.created && (
              <div>
                Version:{" "}
                {moment(version?.created).format("MMMM Do YYYY, h:mm a")}
              </div>
            )}
            {version?.size && (
              <div>Size: {Number(version?.size || 0).toLocaleString()}</div>
            )}
          </Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(NameIndexSearch));
