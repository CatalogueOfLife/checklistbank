import React from "react";
import PropTypes from "prop-types";
import { PlusOutlined } from "@ant-design/icons";
import { Row, Tag, Col } from "antd";
import injectSheet from "react-jss";
import OrganisationForm from "./OrganisationForm";
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
class OrganisationControl extends React.Component {
  static getDerivedStateFromProps(nextProps) {
    // Should be a controlled component
    if ("value" in nextProps) {
      let value = stringToArray(nextProps.value);

      return { organisations: value };
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      organisations: stringToArray(props.value),
      formVisible: false,
      organisationForEdit: null,
    };
  }

  handleClose = (removedTag) => {
    const organisations = this.state.organisations.filter(
      (tag) => tag !== removedTag
    );
    const { array = true } = this.props;
    this.setState({ organisations });
    this.triggerChange(array ? organisations : null);
  };

  showForm = (organisation) => {
    this.setState({ organisationForEdit: organisation, formVisible: true });
  };

  handleInputChange = (event) => {
    this.setState({ inputValue: event.target.value });
  };

  onFormSubmit = (organisation) => {
    const organisations = [...this.state.organisations, organisation];
    const { array = true } = this.props;
    this.setState(
      {
        organisations,
        formVisible: false,
        organisationForEdit: null,
      },
      () => this.triggerChange(array ? organisations : organisation)
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
    const organisations = [...this.state.organisations];
    const organisation = organisations.splice(fromIndex, 1)[0];
    organisations.splice(toIndex, 0, organisation);
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(organisations); // will get derived state from props
    }
  };

  editOrganisation = (organisation) => {
    this.setState(
      { organisationForEdit: organisation, formVisible: true },
      () => this.handleClose(organisation)
    );
  };

  render() {
    const { organisations, formVisible, organisationForEdit } = this.state;
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
              {organisations.map((organisation, index) => (
                <li style={{ float: "left", marginBottom: "4px" }}>
                  <Tag
                    key={organisation.label}
                    closable={removeAll || index !== 0}
                    onClose={() => this.handleClose(organisation)}
                    onClick={() => this.editOrganisation(organisation)}
                  >
                    {organisation.label}
                  </Tag>
                </li>
              ))}
            </ol>
          </DragColumn>

          {!formVisible && (array || organisations.length === 0) && (
            <Tag onClick={this.showForm} className={classes.newTag}>
              <PlusOutlined /> {label}
            </Tag>
          )}
        </Row>
        {formVisible && (
          <Row>
            <Col span={24}>
              <OrganisationForm
                style={{ marginTop: "10px" }}
                data={organisationForEdit}
                onSubmit={this.onFormSubmit}
                onCancel={() => this.setState({ formVisible: false })}
              />
            </Col>{" "}
          </Row>
        )}
      </React.Fragment>
    );
  }
}

OrganisationControl.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired, // text label
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]), // value passed from form field decorator
  onChange: PropTypes.func.isRequired, // callback to been called on any data change
  removeAll: PropTypes.bool, // optional flag, to allow remove all organisations or not
};

export default injectSheet(styles)(OrganisationControl);
