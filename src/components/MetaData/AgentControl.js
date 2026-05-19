import React, { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Row, Tag, Col, Modal } from "antd";
import styles from "../newTag.module.css";
import AgentForm from "./AgentForm";
import AgentPresentation from "./AgentPresentation";
import ReactDragListView from "react-drag-listview";
import _ from "lodash";
const { DragColumn } = ReactDragListView;

const stringToArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  } else if (value) {
    return [value];
  }

  return [];
};

/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
const AgentControl = ({ value, label, removeAll, onChange, agentType = "contact", array = true }) => {
  const [agents, setAgents] = useState(() => stringToArray(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setAgents(stringToArray(value));
  }

  const [formVisible, setFormVisible] = useState(false);
  const [agentForEdit, setAgentForEdit] = useState(null);
  const [editAgentIndex, setEditAgentIndex] = useState(null);

  const triggerChange = (changedValue) => {
    if (onChange) {
      onChange(changedValue);
    }
  };

  const handleClose = (e, index) => {
    if (e) {
      e.preventDefault();
    }
    const newAgents = [...agents];
    newAgents.splice(index, 1);
    setAgents(newAgents);
    triggerChange(array ? newAgents : null);
  };

  const showForm = (agent) => {
    setAgentForEdit(agent || null);
    setFormVisible(true);
  };

  const onFormSubmit = async (agent) => {
    const newAgents = !_.isNull(editAgentIndex)
      ? [...agents]
      : [...agents, agent];
    if (!_.isNull(editAgentIndex)) {
      newAgents.splice(editAgentIndex, 0, agent);
    }

    setAgents(newAgents);
    setFormVisible(false);
    setAgentForEdit(null);
    setEditAgentIndex(null);
    triggerChange(array ? newAgents : agent);

    return Promise.resolve();
  };

  const onDragEnd = (fromIndex, toIndex) => {
    const newAgents = [...agents];
    const agent = newAgents.splice(fromIndex, 1)[0];
    newAgents.splice(toIndex, 0, agent);
    if (onChange) {
      onChange(newAgents); // will get derived state from props
    }
  };

  const editAgent = (agent, index) => {
    setAgentForEdit(agent);
    setEditAgentIndex(index);
    setFormVisible(true);
    handleClose(null, index);
  };

  const dragProps = {
    onDragEnd: onDragEnd,
    nodeSelector: "li",
    handleSelector: "li",
  };

  return (
    <React.Fragment>
      <div>
        <DragColumn {...dragProps}>
          <ol
            style={{
              height: "100%",
              listStyle: "none",
              paddingInlineStart: "0px",
            }}
          >
            {agents.map((agent, index) => {
              const tagElem = (
                <li
                  key={index}
                  style={{
                    //float: "left",
                    display: "inline-block",
                    //marginBottom: "4px",
                    paddingBottom: "4px",
                    height: "100%",
                  }}
                >
                  {" "}
                  <Tag
                    key={index}
                    style={{ height: "100%" }}
                    onClick={() => editAgent(agent, index)}
                    closable={removeAll || index !== 0}
                    onClose={(e) => handleClose(e, index)}
                  >
                    <AgentPresentation
                      agent={agent}
                      noLinks={true}
                      style={{
                        display: "inline-grid",
                        margin: "3px 0px 3px 0px",
                      }}
                    />
                  </Tag>
                </li>
              );
              return tagElem;
            })}
            {!formVisible && (array || agents.length === 0) && (
              <li
                style={{
                  //float: "left",
                  display: "inline",
                  height: "100%",
                }}
              >
                <Tag
                  onClick={() => showForm()}
                  className={styles.newTagTall}
                >
                  <PlusOutlined /> {label}
                </Tag>
              </li>
            )}
          </ol>
        </DragColumn>
      </div>

      <Modal
        open={formVisible}
        footer={null}
        onCancel={() =>
          agentForEdit
            ? onFormSubmit(agentForEdit)
            : setFormVisible(false)
        }
        title={
          agentForEdit
            ? `Editing ${agentType}${
                agentForEdit.name ? " " + agentForEdit.name : ""
              }`
            : `New ${agentType}`
        }
      >
        <AgentForm
          data={agentForEdit}
          style={{ marginTop: "10px" }}
          onSubmit={onFormSubmit}
          onCancel={() =>
            agentForEdit
              ? onFormSubmit(agentForEdit)
              : setFormVisible(false)
          }
        />
      </Modal>
    </React.Fragment>
  );
};

export default AgentControl;
