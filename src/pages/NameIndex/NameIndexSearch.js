import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, Card, Input, AutoComplete } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry from "./Entry";
import RelatedNames from "./RelatedNames";
import axios from "axios";
import config from "../../config";
import history from "../../history";

const NameIndexKey = ({ match, addError }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rank, setRank] = useState("species");
  const onSearch = async (q) => {
    if (q.length > 2) {

      try {
        setLoading(true)
        const res = await axios(
          `${config.dataApi}nidx/pattern?rank=${rank}&q=${q}&limit=20`
        );
        if (res?.data) {
          setOptions(
            res?.data?.map((o) => ({ label: o.scientificName, value: o.id }))
          );
        }
        setLoading(false)
      } catch (err) {
        setLoading(false)

        addError(err);
      }
    }
  };

  const onSelect = (val) => {
    history.push({
      pathname: `/namesindex/${val}`,
    });
  };

  return (
    <Layout
      title="Names Index Search"
      openKeys={["tools"]}
      selectedKeys={["nameIndexSearch"]}
    >
      <PageContent>
        <Row>
          <Col flex="auto"></Col>
          <Col>
            <AutoComplete
              options={options}
              style={{
                width: 400,
              }}
              onSelect={onSelect}
              onSearch={onSearch}
              placeholder="Search the names index"
            >
              <Input.Search  loading={loading} />
            </AutoComplete>
          </Col>
          <Col flex="auto"></Col>
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col>
            
          </Col>
          <Col flex="auto"></Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(NameIndexKey));
