import React from "react";
import {NavLink} from "react-router-dom"
import { LinkOutlined } from '@ant-design/icons';
import { Row, Col, Tag, Tooltip } from "antd";
import Classification from "./Classification";
import _ from "lodash";
import Auth from "../../components/Auth"
import withContext from "../../components/hoc/withContext";

const RowDetail = ({ issues, usage, classification, issueMap, baseUri, sectorDatasetKey, catalogueKey, user }) => (
  <React.Fragment>
    {sectorDatasetKey && Auth.isAuthorised(user, ["editor"]) && 
    <Row style={{ marginBottom: "10px" }}>
    <Col
      span={3}
      style={{
        textAlign: "right",
        paddingRight: "16px",
        fontWeight: "bold"
      }}
    >
      
    </Col>
    <Col span={18}>
    <NavLink
              to={{
                pathname: `/catalogue/${catalogueKey}/dataset/${sectorDatasetKey}/workbench`,
                search: `?q=${_.get(usage, 'name.scientificName')}&rank=${_.get(usage, 'name.rank')}`
              }}
              exact={true}
            >
              <LinkOutlined /> Workbench
            </NavLink>
    </Col>
  </Row>
    }
    {_.get(usage, "id") && (
      <Row style={{ marginBottom: "10px" }}>
        <Col
          span={3}
          style={{
            textAlign: "right",
            paddingRight: "16px",
            fontWeight: "bold"
          }}
        >
          ID:
        </Col>
        <Col span={18}>{_.get(usage, "id")}</Col>
      </Row>
    )}
    {classification && (
      <Row style={{ marginBottom: "10px" }}>
        <Col
          span={3}
          style={{
            textAlign: "right",
            paddingRight: "16px",
            fontWeight: "bold"
          }}
        >
          Classification:
        </Col>
        <Col span={18}>
          <Classification
            classification={_.initial(classification)}
            baseUri={baseUri}
          />
        </Col>
      </Row>
    )}
    {issues && (
      <Row>
        <Col
          span={3}
          style={{
            textAlign: "right",
            paddingRight: "16px",
            fontWeight: "bold"
          }}
        >
          Issues:
        </Col>
        <Col span={18}>
          {issues.map(i => (
            <Tooltip key={i} title={_.get(issueMap, `[${i}].description`)}>
              {" "}
              <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
                {i}
              </Tag>
            </Tooltip>
          ))}
        </Col>
      </Row>
    )}
  </React.Fragment>
);

const mapContextToProps = ({ issueMap, catalogueKey, user }) => ({ issueMap, catalogueKey, user });
export default withContext(mapContextToProps)(RowDetail);
