import { useState, useEffect, useRef } from "react";
import config from "../../config";
import axios from "axios";
import withRouter from "../../withRouter";
import VerbatimPresentation from "../../components/VerbatimPresentation";
import qs from "query-string";
import _ from "lodash";
import { Alert, Row, Col, Pagination, Spin } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import SearchBox from "../DatasetList/SearchBox";
import history from "../../history";
import MultiValueFilter from "../NameSearch/MultiValueFilter";

const removeEmptyValues = (obj) => {
  return Object.entries(obj).reduce(
    (a, [k, v]) => (v ? { ...a, [k]: v } : a),
    {}
  );
};

const VerbatimRecord = (props) => {
  const { location, lastSuccesFullImport, match } = props;
  const matchKey = _.get(match, "params.key");
  const matchSourceKey = _.get(match, "params.sourceKey");
  const key = matchKey || matchSourceKey;

  const [verbatim, setVerbatim] = useState([]);
  const [verbatimError, setVerbatimError] = useState(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);

  // Monotonic id of the newest verbatim request, so a slow response can never
  // overwrite the result of a request that was fired after it.
  const requestId = useRef(0);

  const getIssues = (datasetKey) => {
    axios(
      `${config.dataApi}dataset/${datasetKey}/import?limit=1&status=finished`
    )
      .then((res) => {
        const issuesCount = _.get(res, "data[0].issuesCount", {});
        const newIssues = Object.keys(issuesCount).map((k) => ({
          label: `${k} (${issuesCount[k]})`,
          value: k,
        }));
        setIssues(newIssues);
      })
      .catch(() => {});
  };

  const getVerbatimData = (params, datasetKey) => {
    const id = ++requestId.current;
    setLoading(true);
    axios(`${config.dataApi}dataset/${datasetKey}/verbatim?${qs.stringify(params)}`)
      .then((res) => {
        if (id !== requestId.current) return; // superseded by a newer request
        setVerbatim(res.data.result);
        setVerbatimError(null);
        setLimit(res.data.limit);
        setOffset(res.data.offset);
        setTotal(res.data.total);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== requestId.current) return; // superseded by a newer request
        setVerbatimError(err);
        setVerbatim([]);
        setLoading(false);
      });
  };

  // Issue facets for the dropdown.
  useEffect(() => {
    getIssues(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // The URL is the single source of truth for the query. Keyed on `key` as
  // well, because switching source dataset inside a project changes the path
  // but can leave location.search untouched.
  useEffect(() => {
    let params = qs.parse(_.get(props, "location.search"));
    if (!params.limit) {
      const lsLimit = localStorage.getItem("col_plus_verbatim_limit");
      params.limit = lsLimit ? Number(lsLimit) : 50;
    }
    getVerbatimData(params, key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, _.get(props, "location.search")]);

  const onSearch = (search) => {
    const params = qs.parse(_.get(location, "search"));
    let newQuery = { ...params, ...search, offset: 0 };

    history.push({
      pathname: location.pathname,
      search: `?${qs.stringify(removeEmptyValues(newQuery))}`,
    });
  };

  const current = Number(offset) / Number(limit) + 1;
  const params = qs.parse(_.get(location, "search"));

  const typeFacets = _.get(lastSuccesFullImport, "verbatimByTermCount")
    ? Object.keys(lastSuccesFullImport.verbatimByTermCount).map((t) => ({
        value: t,
        label: `${t} (${lastSuccesFullImport.verbatimByTermCount[t]})`,
      }))
    : [];

  return (
    <Spin spinning={loading}>
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        {verbatimError && (
          <Alert description={<ErrorMsg error={verbatimError} />} type="error" />
        )}
        <Row style={{ marginBottom: "10px" }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            {" "}
            <SearchBox
              onSearch={(value) => onSearch({ q: value })}
              defaultValue={_.get(params, "q")}
            ></SearchBox>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12}>
            <MultiValueFilter
              defaultValue={_.get(params, "type")}
              onChange={(value) => onSearch({ type: value })}
              vocab={typeFacets}
              label="Row type"
            />
            <MultiValueFilter
              defaultValue={_.get(params, "issue")}
              onChange={(value) => onSearch({ issue: value })}
              vocab={issues}
              label="Issues"
            />
          </Col>
          <Col span={24} style={{ textAlign: "right" }}>
            {" "}
            {
              <Pagination
                hideOnSinglePage={true}
                style={{ display: "inline" }}
                current={current}
                showSizeChanger={true}
                onChange={(page, pageSize) => {
                  const newLimit = pageSize || Number(limit);
                  if (newLimit !== Number(limit)) {
                    setLimit(newLimit);
                    localStorage.setItem(
                      "col_plus_verbatim_limit",
                      String(newLimit)
                    );
                  }
                  history.push({
                    pathname: location.pathname,
                    search: `?${qs.stringify({
                      ...params,
                      limit: newLimit,
                      offset: (page - 1) * newLimit,
                    })}`,
                  });
                }}
                pageSize={limit}
                total={total}
              />
            }
          </Col>
        </Row>

        {verbatim &&
          verbatim.length > 0 &&
          verbatim.map((v) => (
            <VerbatimPresentation
              style={{ marginBottom: "10px" }}
              key={v.id}
              record={v}
              datasetKey={v.datasetKey}
              verbatimKey={v.id}
              basicHeader={true}
              location={location}
            />
          ))}
      </div>
    </Spin>
  );
};

const mapContextToProps = ({ dataset }) => ({ dataset });
export default withContext(mapContextToProps)(withRouter(VerbatimRecord));
