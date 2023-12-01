import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, Typography, Card } from "antd";
import PresentationItem from "../../components/PresentationItem";
import BooleanValue from "../../components/BooleanValue";

import Linkify from "react-linkify";
import withContext from "../../components/hoc/withContext";
import config from "../../config";

const { Title } = Typography;

const VocabularyKey = ({
  match: {
    params: { key },
  },
}) => {
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
          <Col span={12}>
            {data.map((item) => (
              <Card
                size="small"
                title={
                  <Title style={{ marginLeft: "6px" }} level={4}>
                    {item.name}
                  </Title>
                }
                style={{ marginBottom: "10px" }}
              >
                {Object.keys(item).map((key) => (
                  <PresentationItem label={key}>
                    {typeof item[key] == "boolean" ? (
                      <BooleanValue value={item[key]} />
                    ) : (
                      <Linkify>{item[key]}</Linkify>
                    )}
                  </PresentationItem>
                ))}
                {/*                 {Object.entries(item).map((key, idx, value) => (<p>{key}: {value}</p>))}
                 */}{" "}
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
