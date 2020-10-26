import React from "react";
import { ArrowUpOutlined } from "@ant-design/icons";
import PersonPresentation from "./PersonPresentation";
import { Row, Col, Switch } from "antd";

import _ from "lodash";
const render = (data, field) => {
  switch (field) {
    case "organisations":
      return _.isArray(data.organisations)
        ? data.organisations.map((o) => o.label)
        : null;
    case "authors":
      return _.isArray(data.authors)
        ? data.authors.map((o) => o.name).join("; ")
        : null;
    case "editors":
      return _.isArray(data.editors)
        ? data.editors.map((o) => o.name).join("; ")
        : null;
    case "contact":
      return <PersonPresentation person={data.contact} />;
    default:
      return data[field];
  }
};

const PatchFormOriginalDataHelp = ({ transferFn, data, field }) => (
  <Row>
    <Col span={22}>
      {_.isNil(data[field]) ? null : (
        <React.Fragment>
          <a onClick={() => transferFn(data[field], field)}>
            <ArrowUpOutlined />
          </a>{" "}
          {render(data, field)}
        </React.Fragment>
      )}
    </Col>
    <Col span={2}>
      <Switch
        style={{ marginBottom: "4px", marginTop: "4px" }}
        checkedChildren="null"
        unCheckedChildren="null"
        onChange={(checked) => {
          if (checked) {
            transferFn(null, field); // Pass null to actually nullify a field by patching
          } else {
            transferFn(undefined, field); // undefined means no patch for this field
          }
        }}
      />
    </Col>
  </Row>
);

export default PatchFormOriginalDataHelp;
