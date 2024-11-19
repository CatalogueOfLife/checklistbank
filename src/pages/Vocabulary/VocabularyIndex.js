import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { NavLink } from "react-router-dom"
import { withRouter } from "react-router-dom";
import { Row, Col, List, Select } from "antd";


import withContext from "../../components/hoc/withContext";
import config from "../../config";

const { Option } = Select;

const VocabularyIndex = ({ addError }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${config.dataApi}vocab`)
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  return (
    <Layout
      title="Vocabulary Index"
      openKeys={["tools"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col>
            Index to all controlled vocabularies used in ChecklistBank.
          </Col>
          <Col flex="auto"></Col>
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col span={16}>
            <NavLink to={{ pathname: `/vocabulary/taxgrouptree` }} exact={true}>TaxGroup tree</NavLink>
          </Col>
          <Col flex="auto"></Col>
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col span={16}>
            <List
              size="large"
              bordered
              dataSource={data}
              renderItem={(item) => <List.Item>
                <NavLink to={{ pathname: `/vocabulary/${item}` }} exact={true}>{item}</NavLink>
              </List.Item>}
            />
          </Col>
          <Col flex="auto"></Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(VocabularyIndex));
