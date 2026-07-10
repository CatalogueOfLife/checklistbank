import { useState, useEffect } from "react";
import withRouter from "../../../withRouter";
import axios from "axios";
import Layout from "../../../components/LayoutNew";
import { Row, Col, Select, Alert } from "antd";
import config from "../../../config";
import history from "../../../history";
import PageContent from "../../../components/PageContent";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import NamesDiffView from "../../../components/NamesDiffView";
import qs from "query-string";

import _ from "lodash";

const SectorDiff = ({ match, location, project, projectKey }) => {
  const { sectorKey } = match.params;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt1, setSelectedAttempt1] = useState(0);
  const [selectedAttempt2, setSelectedAttempt2] = useState(0);
  const [maxAttempt, setMaxAttempt] = useState(0);

  const getData = (query) => {
    const params = qs.parse(_.get({ search: query }, "search"));
    const splittedAttempts = params.attempts
      ? params.attempts.split("..")
      : null;
    const attempt1 = splittedAttempts ? splittedAttempts[0] : null;
    const attempt2 = splittedAttempts ? splittedAttempts[1] : null;
    axios(
      `${config.dataApi}dataset/${projectKey}/sector/${sectorKey}/diff${query}`
    )
      .then((res) => {
        setLoading(false);
        setData(res.data);
        setError(null);
        setSelectedAttempt1(Number(attempt1));
        setSelectedAttempt2(Number(attempt2));
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData(null);
      });
  };

  useEffect(() => {
    const query = _.get({ search: location.search }, "search");
    axios(
      `${config.dataApi}dataset/${projectKey}/sector/sync?sectorKey=${sectorKey}&state=finished&limit=1`
    ).then((res) => {
      setMaxAttempt(_.get(res, "data.result[0].attempt"));
    });
    getData(query);
  }, []);

  useEffect(() => {
    getData(location.search);
  }, [location.search]);

  return (
    <Layout
      selectedKeys={["sectorDiff"]}
      openKeys={["assembly"]}
      selectedSector={sectorKey}
      title={project.title}
    >
      <PageContent>
        <Row style={{ marginBottom: "8px" }}>
          <Col span={12}>
            <Select
              value={selectedAttempt1}
              style={{ width: 120 }}
              onChange={(value) => {
                setSelectedAttempt1(value);
                history.push({
                  pathname: `/project/${projectKey}/sync/${sectorKey}/diff`,
                  search: `?attempts=${value}..${selectedAttempt2}`,
                });
              }}
              showSearch
              options={[...Array(selectedAttempt2).keys()]
                .filter((i) => i > 0)
                .reverse()
                .map((i) => ({ value: i, label: `Attempt: ${i}` }))}
            />
          </Col>
          <Col span={6}>
            <Select
              value={selectedAttempt2}
              style={{ width: 120 }}
              onChange={(value) => {
                setSelectedAttempt2(value);
                history.push({
                  pathname: `/project/${projectKey}/sync/${sectorKey}/diff`,
                  search: `?attempts=${selectedAttempt1}..${value}`,
                });
              }}
              showSearch
              options={[...Array(maxAttempt + 1).keys()]
                .reverse()
                .filter((i) => i > selectedAttempt1)
                .map((i) => ({ value: i, label: `Attempt: ${i}` }))}
            />
          </Col>
        </Row>
        {error && (
          <Row style={{ marginBottom: "8px" }}>
            <Alert type="error" description={<ErrorMsg error={error} />} />
          </Row>
        )}
        {data && <NamesDiffView diff={data} />}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ projectKey, project }) => ({
  projectKey,
  project,
});

export default withRouter(withContext(mapContextToProps)(SectorDiff));
