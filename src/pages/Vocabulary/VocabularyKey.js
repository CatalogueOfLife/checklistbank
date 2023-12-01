import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, List, Card } from "antd";


import withContext from "../../components/hoc/withContext";
import config from "../../config";


const VocabularyKey = ({ match: {
  params: { key },
} }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${config.dataApi}vocab/${key}`)
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  return (
    <Layout
      title={`Vocabulary: ${key}`}
      openKeys={["tools"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col span={16}>
            {data.map((item) => (
              <Card size="small" title={`${item.name}`} style={{ width: 300 }}>
                {Object.entries(item).map((key, idx, value) => (<p>{key}: {value}</p>))}
              </Card>
            ))}
          </Col>
          <Col flex="auto"></Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = () => ({});
export default withContext(mapContextToProps)(withRouter(VocabularyKey));
