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
                <Row key={comp} style={{ padding: "8px 0" }}>
                  <Col span={12} style={{ paddingRight: "16px", textAlign: "right" }}>
                    {_.startCase(comp)}
                  </Col>
                  <Col span={12}>
                    <Tag color={components[comp] ? "green" : "red"}>
                      {components[comp] ? "Active" : "Unavailable"}
                    </Tag>
                  </Col>
                </Row>
              ))}
          </Col>
          <Col xs={24} md={12}>
            <Divider titlePlacement="left">System health</Divider>
            {Object.keys(health).map((hc) => (
              <Row key={hc} style={{ padding: "8px 0" }}>
                <Col span={12} style={{ paddingRight: "16px", textAlign: "right" }}>
                  {_.startCase(hc)}
                </Col>
                <Col span={12}>
                  <Tag color={health[hc].healthy ? "green" : "red"}>
                    {health[hc].healthy ? "Healthy" : "Not healthy"}
                  </Tag>
                </Col>
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
