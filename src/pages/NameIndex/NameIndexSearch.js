import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, Card, Input, AutoComplete, Select } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry from "./Entry";
import RelatedNames from "./RelatedNames";
import axios from "axios";
import config from "../../config";
import history from "../../history";

const {Option} = Select;

const NameIndexKey = ({ nameIndexRank, addError }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selctedRank, setRank] = useState("species");
  const onSearch = async (q) => {
    if (q.length > 2) {

      try {
        setLoading(true)
        const res = await axios(
          `${config.dataApi}nidx/pattern?q=${q}&limit=20${selctedRank ? "&rank="+selctedRank : ""}`
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
                width: 300,
              }}
              onSelect={onSelect}
              onSearch={onSearch}
              placeholder="Search the names index"
            >
              <Input.Search  loading={loading} />
            </AutoComplete>
            <br/>
            <Select showSearch allowClear placeholder="Rank" style={{width: "300px", marginTop: "10px"}} onChange={setRank}>
            <Option value={null}>Any</Option>
              {nameIndexRank.map(r => <Option value={r.name}>{r.label}</Option>)}

            </Select>
            
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

const mapContextToProps = ({ addError, nameIndexRank }) => ({ addError, nameIndexRank });
export default withContext(mapContextToProps)(withRouter(NameIndexKey));
