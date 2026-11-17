import { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, useParams } from "react-router-dom";
import qs from "query-string";
import { Alert, Col, Row, Spin, Table, Typography } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import PresentationItem from "../../components/PresentationItem";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import Auth from "../../components/Auth";
import config from "../../config";

const { Text, Title, Paragraph } = Typography;

// the dataset search filtered by the publisher and the given params
const searchLink = (publisherKey, params = {}) => ({
  pathname: "/dataset",
  search: `?${qs.stringify({ gbifPublisherKey: publisherKey, ...params })}`,
});

// A small table of the dataset counts by one property, each linking to the
// dataset search filtered by that value. Values are shown as the API sends them.
const CountTable = ({ title, param, counts, publisherKey }) => {
  const rows = Object.entries(counts || {})
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
  return (
    <Table
      size="small"
      rowKey="value"
      pagination={false}
      dataSource={rows}
      locale={{ emptyText: "none" }}
      columns={[
        {
          title,
          dataIndex: "value",
          render: (value) => (
            <NavLink to={searchLink(publisherKey, { [param]: value })}>{value}</NavLink>
          ),
        },
        {
          title: "Datasets",
          dataIndex: "count",
          align: "right",
          render: (count) => count.toLocaleString(),
        },
      ]}
    />
  );
};

/**
 * A short page about a GBIF publisher as copied from the GBIF registry, with
 * the number of its datasets by origin, type and license, each linking to the
 * dataset search.
 */
const Publisher = ({ user }) => {
  const { key } = useParams();
  const [publisher, setPublisher] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPublisher(null);
    setMetrics(null);
    Promise.all([
      axios(`${config.dataApi}publisher/${key}`),
      axios(`${config.dataApi}publisher/${key}/metrics`),
    ])
      .then(([p, m]) => {
        setPublisher(p.data);
        setMetrics(m.data);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key]);

  const location = publisher && [publisher.city, publisher.province, publisher.country].filter(Boolean).join(", ");
  const isEditor = Auth.isAuthorised(user, ["editor", "admin"]);

  return (
    <Layout
      openKeys={isEditor ? ["admin"] : undefined}
      selectedKeys={isEditor ? ["publisherAdmin"] : undefined}
      title={publisher?.title || "Publisher"}
    >
      <PageContent>
        {error && (
          <Alert
            type="error"
            style={{ marginBottom: 10 }}
            description={
              error?.response?.status === 404 ? `There is no publisher ${key} in ChecklistBank` : <ErrorMsg error={error} />
            }
          />
        )}
        {loading && <Spin />}
        {publisher && (
          <>
            <Title level={3}>{publisher.title || publisher.key}</Title>
            {/* GBIF organisations often have their homepage as description */}
            {publisher.description && publisher.description !== publisher.homepage && (
              <Paragraph>{publisher.description}</Paragraph>
            )}
            {publisher.homepage && (
              <PresentationItem label="Homepage">
                <a href={publisher.homepage} target="_blank" rel="noreferrer">
                  {publisher.homepage}
                </a>
              </PresentationItem>
            )}
            {location && <PresentationItem label="Location">{location}</PresentationItem>}
            <PresentationItem label="GBIF organisation">
              <a href={`${config.gbifUrl}publisher/${publisher.key}`} target="_blank" rel="noreferrer">
                {publisher.key}
              </a>
            </PresentationItem>
          </>
        )}
        {metrics && (
          <>
            <PresentationItem label="Datasets">
              <span>
                <NavLink to={searchLink(key)}>{metrics.datasets.toLocaleString()}</NavLink>
                {metrics.private > 0 && (
                  <>
                    {", "}
                    <NavLink to={searchLink(key, { private: true })}>
                      {`${metrics.private.toLocaleString()} of them private`}
                    </NavLink>
                  </>
                )}
              </span>
            </PresentationItem>
            <PresentationItem label="Name usages">{metrics.usages.toLocaleString()}</PresentationItem>
            {metrics.datasets > 0 && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} md={8}>
                  <CountTable title="Origin" param="origin" counts={metrics.origin} publisherKey={key} />
                </Col>
                <Col xs={24} md={8}>
                  <CountTable title="Type" param="type" counts={metrics.type} publisherKey={key} />
                </Col>
                <Col xs={24} md={8}>
                  <CountTable title="License" param="license" counts={metrics.license} publisherKey={key} />
                </Col>
              </Row>
            )}
            <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
              Deleted and temporary datasets are not counted, nor private ones you cannot read.
            </Text>
          </>
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ user }) => ({ user });
export default withContext(mapContextToProps)(Publisher);
