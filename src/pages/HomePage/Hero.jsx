import React from "react";
import { Row, Col } from "antd";
export default ({ image }) => (
  <div
    style={{
      width: "100%",
      height: "300px",
      backgroundImage: `url("${image}")`,
      backgroundSize: "cover",
    }}
  >
    <Row>
      <Col flex="auto"></Col>
      <Col>
        <h1 style={{ color: "white", fontSize: "4em", marginBottom: 0, marginTop: "1em" }}>
          ChecklistBank
        </h1>
      </Col>
      <Col flex="auto"></Col>
    </Row>
    <Row>
      <Col flex="auto"></Col>

      <Col>
        <div style={{ borderTop: "2px solid gold", width: "200px" }} />
      </Col>
      <Col flex="auto"></Col>
    </Row>
    <Row>
      <Col flex="auto"></Col>

      <Col>
        <h3 style={{ color: "white", marginTop: "1em" }}>
          Index and repository for taxonomic data
        </h3>
      </Col>
      <Col flex="auto"></Col>
    </Row>
  </div>
);
