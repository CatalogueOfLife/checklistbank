import React from "react";
import { ArrowUpOutlined } from "@ant-design/icons";
import AgentPresentation from "./AgentPresentation";
import { Row, Col, Switch, Divider } from "antd";

import _ from "lodash";

import IDENTIFIER_TYPES from "../../pages/DatasetKey/datasetPageTabs/DatasetMeta";

const render = (data, field) => {
  switch (field) {
    case "creator":
      return _.isArray(data.creator)
        ? data.creator.map((o) => <AgentPresentation agent={o} />)
        : null;
    case "editor":
      return _.isArray(data.editor)
        ? data.editor.map((o) => <AgentPresentation agent={o} />)
        : null;
    case "contributor":
      return _.isArray(data.contributor)
        ? data.contributor.map((o) => <AgentPresentation agent={o} />)
        : null;
    case "contact":
      return <AgentPresentation agent={data.contact} />;
    case "publisher":
      return <AgentPresentation agent={data.publisher} />;
    case "source":
      return (
        <>
          {data?.source.map((citation) => (
            <Row>
              {citation.citation ? (
                <div
                  style={{
                    display: "inline-block",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: citation.citation,
                  }}
                ></div>
              ) : (
                <div
                  style={{
                    display: "inline-block",
                  }}
                >
                  {citation.title}
                </div>
              )}
            </Row>
          ))}
        </>
      );
    case "identifier":
      return (
        <ol
          style={{
            listStyle: "none",
            paddingInlineStart: "0px",
          }}
        >
          {Object.keys(data.identifier).map((i) => (
            <li
              style={{
                float: "left",
                marginRight: "8px",
              }}
            >
              {`${i.toUpperCase()}: `}
              {IDENTIFIER_TYPES[i] ? (
                <a
                  href={`${IDENTIFIER_TYPES[i]}${data.identifier[i]}`}
                  target="_blank"
                >
                  {data.identifier[i]}
                </a>
              ) : (
                data.identifier[i]
              )}
            </li>
          ))}
        </ol>
      );
    default:
      return data[field];
  }
};

const PatchFormOriginalDataHelp = ({ transferFn, data, field }) => (
  <React.Fragment>
    <Row style={{ display: "12px" }}>
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
    <Divider />
  </React.Fragment>
);

export default PatchFormOriginalDataHelp;
