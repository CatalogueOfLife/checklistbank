import React from "react";
import PropTypes from "prop-types";
import { PlusOutlined } from "@ant-design/icons";
import { Row, Tag, Col } from "antd";
import injectSheet from "react-jss";
import AgentForm from "./AgentForm";
import AgentPresentation from "./AgentPresentation";
import ReactDragListView from "react-drag-listview";
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
    };
  }

  handleClose = (removedTag) => {
    const agents = this.state.agents.filter((tag) => tag !== removedTag);
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

  onFormSubmit = (agent) => {
    const agents = [...this.state.agents, agent];
    const { array = true } = this.props;
    this.setState(
      {
        agents,
        formVisible: false,
        agentForEdit: null,
      },
      () => this.triggerChange(array ? agents : agent)
    );
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

  editAgent = (agent) => {
    this.setState({ agentForEdit: agent, formVisible: true }, () =>
      this.handleClose(agent)
    );
  };

  render() {
    const { agents, formVisible, agentForEdit } = this.state;
    const { classes, label, removeAll, array = true } = this.props;

    const dragProps = {
      onDragEnd: this.onDragEnd,
      nodeSelector: "li",
      handleSelector: "li",
    };

    return (
      <React.Fragment>
        <Row>
          <DragColumn {...dragProps}>
            <ol style={{ listStyle: "none", paddingInlineStart: "0px" }}>
              {agents.map((agent, index) => {
                const tagElem = (
                  <li style={{ float: "left", marginBottom: "4px" }}>
                    {" "}
                    <Tag
                      key={index}
                      onClick={() => this.editAgent(agent)}
                      closable={removeAll || index !== 0}
                      onClose={() => this.handleClose(agent)}
                    >
                      <AgentPresentation
                        agent={agent}
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
            </ol>
          </DragColumn>

          {!formVisible && (array || agents.length === 0) && (
            <Tag onClick={this.showForm} className={classes.newTag}>
              <PlusOutlined /> {label}
            </Tag>
          )}
        </Row>
        {formVisible && (
          <Row>
            <Col span={24}>
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
            </Col>{" "}
          </Row>
        )}
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
