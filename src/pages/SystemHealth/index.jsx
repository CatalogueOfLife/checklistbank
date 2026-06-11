import React, { useEffect } from "react";
import _ from "lodash";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";

import { Helmet } from "react-helmet-async";
import { Row, Divider, Alert, Col, Tag } from "antd";
import ErrorMsg from "../../components/ErrorMsg";

const SystemHealth = ({ components, health, getSystemHealth }) => {
  useEffect(() => {
    getSystemHealth();
  }, [getSystemHealth]);
  return (
    <Layout
      /* openKeys={["admin"]}
        selectedKeys={["adminSettings"]} */
      title="System Health"
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>System Health</title>
      </Helmet>
      <PageContent>
        <Row gutter={32}>
          <Col xs={24} md={12}>
            <Divider titlePlacement="left">Components</Divider>
            {Object.keys(components)
              .filter((c) => c != "idle")
              .map((comp) => (
                <Row key={comp} align="middle" style={{ padding: "8px 0" }}>
                  <Col flex="110px">
                    <Tag
                      color={components[comp] ? "green" : "red"}
                      style={{ width: "100%", textAlign: "center", margin: 0 }}
                    >
                      {components[comp] ? "Active" : "Unavailable"}
                    </Tag>
                  </Col>
                  <Col flex="auto">{_.startCase(comp)}</Col>
                </Row>
              ))}
          </Col>
          <Col xs={24} md={12}>
            <Divider titlePlacement="left">System health</Divider>
            {Object.keys(health).map((hc) => (
              <Row key={hc} align="middle" style={{ padding: "8px 0" }}>
                <Col flex="110px">
                  <Tag
                    color={health[hc].healthy ? "green" : "red"}
                    style={{ width: "100%", textAlign: "center", margin: 0 }}
                  >
                    {health[hc].healthy ? "Healthy" : "Not healthy"}
                  </Tag>
                </Col>
                <Col flex="auto">{_.startCase(hc)}</Col>
              </Row>
            ))}
          </Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({
  getSystemHealth,
  components,
  health,
  background,
  addError,
}) => ({
  getSystemHealth,
  components,
  health,
  background,
  addError,
});
export default withContext(mapContextToProps)(SystemHealth);
