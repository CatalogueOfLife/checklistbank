import React from "react";
import PropTypes from "prop-types";
import { PlusOutlined } from "@ant-design/icons";
import { Row, Tag, Modal } from "antd";
import injectSheet from "react-jss";
import CslForm from "./CslForm";
import _ from "lodash";

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
class CitationControl extends React.Component {
  static getDerivedStateFromProps(nextProps) {
    // Should be a controlled component
    if ("value" in nextProps) {
      let value = stringToArray(nextProps.value);

      return { citations: value };
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      citations: stringToArray(props.value),
      formVisible: false,
      citationForEdit: null,
    };
  }

  handleClose = (e, removedTag) => {
    if (e) {
      e.preventDefault();
    }
    const citations = this.state.citations.filter((tag) => tag !== removedTag);
    const { array = true } = this.props;
    this.setState({ citations });
    this.triggerChange(array ? citations : null);
  };

  showForm = (citation) => {
    this.setState({ citationForEdit: citation, formVisible: true });
  };

  handleInputChange = (event) => {
    this.setState({ inputValue: event.target.value });
  };

  onFormSubmit = async (citation) => {
    const { indexForEdit } = this.state;

    const citations = !_.isNull(indexForEdit)
      ? [
          ...this.state.citations.slice(0, indexForEdit),
          citation,
          ...this.state.citations.slice(indexForEdit),
        ]
      : [...this.state.citations, citation];
    const { array = true } = this.props;
    this.setState(
      {
        citations,
        formVisible: false,
        citationForEdit: null,
        indexForEdit: null,
      },
      () => this.triggerChange(array ? citations : citation)
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
    const citations = [...this.state.citations];
    const citation = citations.splice(fromIndex, 1)[0];
    citations.splice(toIndex, 0, citation);
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(citations); // will get derived state from props
    }
  };

  editAgent = (index, citation) => {
    this.setState(
      { citationForEdit: citation, indexForEdit: index, formVisible: true },
      () => this.handleClose(null, citation)
    );
  };

  render() {
    const { citations, formVisible, citationForEdit } = this.state;
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
        <Row>
          <ol
            style={{
              height: "100%",
              listStyle: "none",
              paddingInlineStart: "0px",
            }}
          >
            {citations
              .filter((c) => !!c)
              .map((citation, index) => {
                const tagElem = (
                  <li
                    key={index}
                    style={{
                      marginBottom: "4px",
                      height: "100%",
                    }}
                  >
                    {" "}
                    <Tag
                      key={index}
                      style={{ height: "100%" }}
                      onClick={() => this.editAgent(index, citation)}
                      closable={true}
                      onClose={(e) => this.handleClose(e, citation)}
                    >
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
                    </Tag>
                  </li>
                );
                return tagElem;
              })}
            {!formVisible && (array || citations.length === 0) && (
              <li
                style={{
                  marginBottom: "4px",
                  height: "100%",
                }}
              >
                <Tag onClick={() => this.showForm()} className={classes.newTag}>
                  <PlusOutlined /> {label}
                </Tag>
              </li>
            )}
          </ol>
        </Row>

        <Modal
          width={1000}
          visible={formVisible}
          footer={null}
          onCancel={() =>
            citationForEdit
              ? this.onFormSubmit(citationForEdit)
              : this.setState({ formVisible: false })
          }
          title={
            citationForEdit
              ? `Editing citation${
                  citationForEdit.id ? " " + citationForEdit.id : ""
                }`
              : `New citation`
          }
        >
          <CslForm
            data={formVisible ? citationForEdit : null}
            onSubmit={this.onFormSubmit}
            onCancel={() =>
              citationForEdit
                ? this.onFormSubmit(citationForEdit)
                : this.setState({ formVisible: false })
            }
          />
        </Modal>
      </React.Fragment>
    );
  }
}

CitationControl.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired, // text label
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]), // value passed from form field decorator
  onChange: PropTypes.func.isRequired, // callback to been called on any data change
  removeAll: PropTypes.bool, // optional flag, to allow remove all citations or not
};

export default injectSheet(styles)(CitationControl);
