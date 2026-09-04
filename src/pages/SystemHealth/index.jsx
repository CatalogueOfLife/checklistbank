import React, { useEffect } from "react";
import _ from "lodash";

import Layout from "../../components/LayoutNew";

import withContext from "../../components/hoc/withContext";
import PageContent from "../../components/PageContent";

import { Helmet } from "react-helmet-async";
import { Row, Divider, Col, Tag } from "antd";

const SystemHealth = ({ components, health, getSystemHealth }) => {
  useEffect(() => {
    // Fetch once on mount. getSystemHealth is recreated on every
    // ContextProvider render and itself sets state, so depending on it here
    // caused an infinite fetch loop (hundreds of requests/min). Background
    // polling (every healthHeartBeat) keeps the data fresh afterwards.
    getSystemHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
            {Object.keys(components).map((comp) => {
              // A component that start-all does not start in this environment is
              // off on purpose, not unavailable. One disabled for the environment
              // is not reported at all and so never reaches here.
              const { running, autostart } = components[comp];
              const [color, label] = running
                ? ["green", "Active"]
                : autostart
                ? ["red", "Unavailable"]
                : ["default", "Manual"];
              return (
                <Row key={comp} align="middle" style={{ padding: "8px 0" }}>
                  <Col flex="92px">
                    <Tag
                      color={color}
                      variant="outlined"
                      style={{ width: "100%", textAlign: "center", margin: 0 }}
                    >
                      {label}
                    </Tag>
                  </Col>
                  <Col flex="auto" style={{ paddingLeft: "12px" }}>
                    {_.startCase(comp)}
                  </Col>
                </Row>
              );
            })}
          </Col>
          <Col xs={24} md={12}>
            <Divider titlePlacement="left">System health</Divider>
            {Object.keys(health).map((hc) => (
              <Row key={hc} align="middle" style={{ padding: "8px 0" }}>
                <Col flex="92px">
                  <Tag
                    color={health[hc].healthy ? "green" : "red"}
                    variant="outlined"
                    style={{ width: "100%", textAlign: "center", margin: 0 }}
                  >
                    {health[hc].healthy ? "Healthy" : "Not healthy"}
                  </Tag>
                </Col>
                <Col flex="auto" style={{ paddingLeft: "12px" }}>
                  {_.startCase(hc)}
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
