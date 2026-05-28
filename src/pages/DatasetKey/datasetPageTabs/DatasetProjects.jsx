import { useState, useEffect } from "react";
import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Tooltip } from "antd";
import config from "../../../config";
import PageContent from "../../../components/PageContent";

import withContext from "../../../components/hoc/withContext";
import _ from "lodash";

const DatasetProjects = ({ dataset }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getMetrics = (datasetKey, sourceDatasetKey) => {
    return axios(
      `${config.dataApi}dataset/${datasetKey}/source/${sourceDatasetKey}/metrics`
    ).then((res) => res.data);
  };

  const getData = (datasetKey) => {
    setLoading(true);

    axios(
      `${config.dataApi}dataset?limit=1000&hasSourceDataset=${datasetKey}&origin=PROJECT`
    )
      .then((res) => {
        return Promise.all(
          !res.data.result
            ? []
            : res.data.result.map((r) => {
              return getMetrics(r.key, datasetKey).then((metrics) => ({
                ...r,
                sectorCount: metrics.sectorCount,
                nameCount: metrics.nameCount,
                taxonCount: metrics.taxonCount,
                synonymCount: metrics.synonymCount,
                referenceCount: metrics.referenceCount,
                distributionCount: metrics.distributionCount,
                vernacularCount: metrics.vernacularCount,
                usagesCount: metrics.usagesCount,
              }));
            })
        ).then((res) => res);
      })
      .then((res) => {
        setLoading(false);
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  useEffect(() => {
    if (dataset?.key) {
      getData(dataset.key);
    }
  }, [dataset?.key]);

  const columns = [
    {
      title: "Project",
      dataIndex: "title",
      key: "title",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.alias ? `${record.alias} [${record.key}]` : record.key}
            </NavLink>
            {record.selectedReleaseMetrics && <div>Selected release:</div>}
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return ("" + a.alias).localeCompare(b.alias);
      },
    },
    {
      title: (
        <Tooltip title={`Total sector count in last sync`}>
          Sector count
        </Tooltip>
      ),
      dataIndex: "sectorCount",
      key: "sectorCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.sectorCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `sectorCount`) || 0) -
          Number(_.get(b, `sectorCount`) || 0)
        );
      },
    },
    {
      title: (
        <Tooltip title={`Total name count in last sync`}>Name count</Tooltip>
      ),
      dataIndex: "nameCount",
      key: "nameCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.nameCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `nameCount`) || 0) -
          Number(_.get(b, `nameCount`) || 0)
        );
      },
    },
    {
      title: (
        <Tooltip title={`Total usages in last sync`}>Usages count</Tooltip>
      ),
      dataIndex: "usagesCount",
      key: "usagesCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.usagesCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `usagesCount`) || 0) -
          Number(_.get(b, `usagesCount`) || 0)
        );
      },
    },
    {
      title: (
        <Tooltip title={`Total synonym count in last sync`}>
          Synonym count
        </Tooltip>
      ),
      dataIndex: "synonymCount",
      key: "synonymCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.synonymCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `synonymCount`) || 0) -
          Number(_.get(b, `synonymCount`) || 0)
        );
      },
    },
    {
      title: (
        <Tooltip title={`Total taxon count in last sync`}>
          Taxon count
        </Tooltip>
      ),
      dataIndex: "taxonCount",
      key: "taxonCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.taxonCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `taxonCount`) || 0) -
          Number(_.get(b, `taxonCount`) || 0)
        );
      },
    },
    {
      title: (
        <Tooltip title={`Total vernacular count in last sync`}>
          Vernacular count
        </Tooltip>
      ),
      dataIndex: "vernacularCount",
      key: "vernacularCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.vernacularCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `vernacularCount`) || 0) -
          Number(_.get(b, `vernacularCount`) || 0)
        );
      },
    },
    {
      title: (
        <Tooltip title={`Total distribution count in last sync`}>
          Distribution count
        </Tooltip>
      ),
      dataIndex: "distributionCount",
      key: "distributionCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.distributionCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `distributionCount`) || 0) -
          Number(_.get(b, `distributionCount`) || 0)
        );
      },
    },
    {
      title: (
        <Tooltip title={`Total references in last import`}>
          Refererences count
        </Tooltip>
      ),
      dataIndex: "referenceCount",
      key: "referenceCount",
      render: (text, record) => {
        return (
          <React.Fragment>
            <NavLink
              to={{
                pathname: `/dataset/${record.key}/classification`,
              }}
              end
            >
              {record.referenceCount}
            </NavLink>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        return (
          Number(_.get(a, `referenceCount`) || 0) -
          Number(_.get(b, `referenceCount`) || 0)
        );
      },
    },
  ];

  return (
    <PageContent>
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        <div>
          <Row>
            <Col md={12} sm={24}></Col>
            <Col md={12} sm={24}></Col>
          </Row>
          {error && <Alert title={error.message} type="error" />}
        </div>
        {!error && (
          <Table
            size="small"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{ pageSize: 100 }}
          />
        )}
      </div>
    </PageContent>
  );
};

const mapContextToProps = ({ user, issue, issueMap, project }) => ({
  user,
  issue,
  issueMap,
  project,
});

export default withContext(mapContextToProps)(DatasetProjects);
