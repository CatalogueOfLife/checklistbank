import React from "react";
import PropTypes from "prop-types";
import { PlusOutlined } from "@ant-design/icons";
import { Row, Tag, Col, Modal } from "antd";
import injectSheet from "react-jss";
import CslForm from "../../pages/catalogue/CatalogueReferences/CslForm";
import CitationPresentation from "./CitationPresentation";
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
class CitationtControl extends React.Component {
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
      csl: props.value,
      formVisible: false,
    };
  }

  handleClose = (removedTag) => {
    const agents = this.state.agents.filter((tag) => tag !== removedTag);
    const { array = true } = this.props;
    this.setState({ agents });
    this.triggerChange(array ? agents : null);
  };

  showForm = () => {
    this.setState({ formVisible: true });
  };

  handleInputChange = (event) => {
    this.setState({ inputValue: event.target.value });
  };

  onFormSubmit = (csl) => {
    this.setState(
      {
        formVisible: false,
        csl,
      },
      () => this.triggerChange(csl)
    );
  };

  triggerChange = (changedValue) => {
    // Should provide an event to pass value to Form
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(changedValue);
    }
  };

  editCsl = (csl) => {
    this.setState({ CslForEdit: csl, formVisible: true }, () =>
      this.handleClose(csl)
    );
  };

  render() {
    const { csl, formVisible, CslForEdit } = this.state;
    const { classes, label } = this.props;

    return (
      <React.Fragment>
        <Row>
          {csl && (
            <Tag
              style={{ height: "100%" }}
              onClick={() => this.editCsl(csl)}
              onClose={() => this.handleClose(csl)}
            >
              <CitationPresentation
                csl={csl}
                style={{
                  display: "inline-grid",
                  margin: "3px 0px 3px 0px",
                }}
              />
            </Tag>
          )}

          {!formVisible && !csl && (
            <Tag onClick={() => this.showForm()} className={classes.newTag}>
              <PlusOutlined /> {label}
            </Tag>
          )}
        </Row>

        <Modal
          visible={formVisible}
          footer={null}
          onCancel={() =>
            csl ? this.onFormSubmit(csl) : this.setState({ formVisible: false })
          }
          title={csl ? `Editing citation` : `Create citation`}
        >
          <CslForm
            data={csl}
            style={{ marginTop: "10px" }}
            onSubmit={this.onFormSubmit}
            onCancel={() =>
              csl
                ? this.onFormSubmit(csl)
                : this.setState({ formVisible: false })
            }
          />
        </Modal>
      </React.Fragment>
    );
  }
}

CitationtControl.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired, // text label
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]), // value passed from form field decorator
  onChange: PropTypes.func.isRequired, // callback to been called on any data change
};

export default injectSheet(styles)(CitationtControl);
