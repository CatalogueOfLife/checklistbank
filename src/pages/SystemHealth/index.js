import React, { useEffect } from "react";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";

import Helmet from "react-helmet";
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
        <Divider orientation="left">Components</Divider>
        {Object.keys(components)
          .filter((c) => c != "idle")
          .map((comp) => (
            <Row>
              <Col flex="auto" />
              <Col span={10} style={{ padding: "16px", textAlign: "right" }}>
                {_.startCase(comp)}
              </Col>
              <Col span={10} style={{ padding: "16px" }}>
                <Tag color={components[comp] ? "green" : "red"}>
                  {components[comp] ? "Operational" : "Not operational"}
                </Tag>
              </Col>
              <Col flex="auto" />
            </Row>
          ))}
        <Divider orientation="left">System health</Divider>
        {Object.keys(health).map((hc) => (
          <Row>
            <Col flex="auto" />
            <Col span={10} style={{ padding: "16px", textAlign: "right" }}>
              {_.startCase(hc)}
            </Col>
            <Col span={10} style={{ padding: "16px" }}>
              <Tag color={health[hc].healthy ? "green" : "red"}>
                {health[hc].healthy ? "Healthy" : "Not healthy"}
              </Tag>
            </Col>
            <Col flex="auto" />
          </Row>
        ))}
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
