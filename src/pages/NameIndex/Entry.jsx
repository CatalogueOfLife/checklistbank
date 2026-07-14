import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Row, Col, Switch } from "antd";
import PresentationItem from "../../components/PresentationItem";

const Entry = ({ record }) => {
  const [asJson, setAsJson] = useState(false);

  return (
    <>
      <Row>
        <Col flex="auto"></Col>
        <Col>
          <Switch
            style={{ marginBottom: "4px", marginTop: "4px" }}
            checkedChildren="JSON"
            unCheckedChildren="JSON"
            onChange={(checked) => {
              setAsJson(checked);
            }}
          />
        </Col>
      </Row>
      {asJson ? (
        <pre>{JSON.stringify(record, null, 2)}</pre>
      ) : (
        <>
          <PresentationItem label="ID">
            <NavLink to={{ pathname: `/namesindex/${record.nidx}` }}>
              {record.nidx}
            </NavLink>
          </PresentationItem>
          <PresentationItem label="Normalized">
            {record.normalizedName}
          </PresentationItem>
          <PresentationItem label="Scientific Name">
            {record.scientificName}
          </PresentationItem>
        </>
      )}
    </>
  );
};

export default Entry;
