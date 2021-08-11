import React from "react";
import PropTypes from "prop-types";
import { PlusOutlined } from "@ant-design/icons";
import { Row, Tag, Col, Modal } from "antd";
import injectSheet from "react-jss";
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

const styles = {
  newTag: {
    background: "#fff",
    borderStyle: "dashed",
    maxHeight: "22px",
  },
};

/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
class AgentControl extends React.Component {
  static getDerivedStateFromProps(nextProps) {
    // Should be a controlled component
    if ("value" in nextProps) {
      let value = stringToArray(nextProps.value);

      return { agents: value };
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      agents: stringToArray(props.value),
      formVisible: false,
      agentForEdit: null,
      editAgentIndex: null,
    };
  }

  handleClose = (e, index) => {
    if (e) {
      e.preventDefault();
    }
    const agents = [...this.state.agents];
    agents.splice(index, 1); // this.state.agents.filter((tag) => tag !== removedTag);
    const { array = true } = this.props;
    this.setState({ agents });
    this.triggerChange(array ? agents : null);
  };

  showForm = (agent) => {
    this.setState({ agentForEdit: agent, formVisible: true });
  };

  handleInputChange = (event) => {
    this.setState({ inputValue: event.target.value });
  };

  onFormSubmit = async (agent) => {
    const { editAgentIndex } = this.state;
    const agents = !_.isNull(editAgentIndex)
      ? [...this.state.agents]
      : [...this.state.agents, agent];
    if (!_.isNull(editAgentIndex)) {
      agents.splice(editAgentIndex, 0, agent);
    }
    const { array = true } = this.props;
    this.setState(
      {
        agents,
        formVisible: false,
        agentForEdit: null,
        editAgentIndex: null,
      },
      () => this.triggerChange(array ? agents : agent)
    );
    return Promise.resolve();
  };

  triggerChange = (changedValue) => {
    // Should provide an event to pass value to Form
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(changedValue);
    }
  };

  onDragEnd = (fromIndex, toIndex) => {
    const agents = [...this.state.agents];
    const agent = agents.splice(fromIndex, 1)[0];
    agents.splice(toIndex, 0, agent);
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(agents); // will get derived state from props
    }
  };

  editAgent = (agent, index) => {
    this.setState(
      { agentForEdit: agent, editAgentIndex: index, formVisible: true },
      () => this.handleClose(null, index)
    );
  };

  render() {
    const { agents, formVisible, agentForEdit } = this.state;
    const {
      classes,
      label,
      removeAll,
      agentType = "contact",
      array = true,
    } = this.props;

    const dragProps = {
      onDragEnd: this.onDragEnd,
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
                      onClick={() => this.editAgent(agent, index)}
                      closable={removeAll || index !== 0}
                      onClose={(e) => this.handleClose(e, index)}
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
                    onClick={() => this.showForm()}
                    className={classes.newTag}
                  >
                    <PlusOutlined /> {label}
                  </Tag>
                </li>
              )}
            </ol>
          </DragColumn>
        </div>

        <Modal
          visible={formVisible}
          footer={null}
          onCancel={() =>
            agentForEdit
              ? this.onFormSubmit(agentForEdit)
              : this.setState({ formVisible: false })
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
            onSubmit={this.onFormSubmit}
            onCancel={() =>
              agentForEdit
                ? this.onFormSubmit(agentForEdit)
                : this.setState({ formVisible: false })
            }
          />
        </Modal>
      </React.Fragment>
    );
  }
}

AgentControl.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired, // text label
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]), // value passed from form field decorator
  onChange: PropTypes.func.isRequired, // callback to been called on any data change
  removeAll: PropTypes.bool, // optional flag, to allow remove all agents or not
};

export default injectSheet(styles)(AgentControl);
