import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import { Select, Input, Pagination, Row, Col, Form, Typography, Popover, Divider } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { getRegEx } from "../../api/regex";
const { Option } = Select;
const { Search } = Input;

const limit = 50;

const RegExSearch = ({ onSearch, onReset, datasetKey, style = {} }) => {
  const [regEx, setRegEx] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(limit);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState([]);
  useEffect(() => {
    getRegEx().then(setOptions);
  }, []);
  const getData = async (regEx_, page_ = 1) => {
    setError(null);
    setPage(page_);
    setRegEx(regEx_);

    const offset = (page_ - 1) * limit;
    if (regEx_) {
      try {
        //pagination?.pageSize || 50;
        const res = await axios(
          `${config.dataApi}dataset/${datasetKey}/nameusage/pattern?regex=${encodeURIComponent(regEx_)}&limit=${limit}&offset=${offset}`
        );
        setTotal(offset + 1 + res?.data?.length);
        console.log(
          `Data length ${res?.data?.length} total ${
            offset + 1 + res?.data?.length
          }`
        );
        if (res?.data) {
          onSearch(res?.data.map((v) => v.id));
        }
      } catch (err) {
        console.log(err);
        setError(err);
      }
    } else {
      onReset();
    }
  };

  return (
    <div style={style}>
      <Row justify="space-between">
        <Col span={8}>
          <Form layout="vertical">
            <Form.Item label="Select pre-defined regular expression">
              <Select
                style={{ width: "100%" }}
                onChange={(val) => getData(val)}
                placeholder="Select regex"
                allowClear
              >
                {options.map((o) => (
                  <Option value={o.value}>
                    <div style={{ fontWeight: "bold" }}>{o.value}</div>
                    <Typography.Text disabled>{o.description}</Typography.Text>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            

          </Form>
        </Col>
        <Col style={{ marginLeft: "10px" }} span={8}>
          <Form layout="vertical">
            <Form.Item
              label={<><span style={{marginRight: "10px"}}>or type regular expression </span><Popover placement="bottomLeft" title="Resources" content={<>
              <a target="_blank" href="https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-POSIX-REGEXP"> PostgreSQL RegEx details</a>
              <br/>
              <a target="_blank" href="https://regex101.com/">Online RegEx tester</a>
              </>} trigger="click">
              <Typography.Link> <InfoCircleOutlined /></Typography.Link> 
            </Popover></>}
              hasFeedback
              validateStatus={error ? "error" : null}
              help={_.get(error, "response.data.message")}
            >
              <Search
                placeholder="Regular expression"
                onSearch={(val) => getData(val)}
                allowClear
              ></Search>
            </Form.Item>
            
           
          </Form>
        </Col>
        <Col flex="auto"></Col>
        <Col>
          {regEx && (
            <>
              <div style={{ marginBottom: "8px" }}>
                Regular expression results
              </div>
              <Pagination
                showSizeChanger={false}
                current={page}
                onChange={(cur) => getData(regEx, cur)}
                total={total}
                pageSize={limit}
              />
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

const mapContextToProps = ({ addError }) => ({
  addError,
});

export default withContext(mapContextToProps)(RegExSearch);
