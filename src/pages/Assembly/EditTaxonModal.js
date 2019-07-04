import React from "react";
import {
  Form,
  Input,
  Modal,
  Select,
  Alert,
  Steps,
  Button,
  notification
} from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const Option = Select.Option;
const FormItem = Form.Item;
const Step = Steps.Step;

const removeEmptyValues = (myObj) => {
    
    Object.keys(myObj).forEach((key) => {
        
        (typeof myObj[key] === 'undefined' || myObj[key] === ''  || myObj[key] === null ) && delete myObj[key]});

   
}
const steps = [
  {
    title: "Enter name",
    okText: "Parse name",
    cancelText: "Cancel"
  },
  {
    title: "Review parsed",
    okText: "Submit",
    cancelText: "Previous"
  },
  {
    title: "Submit",
    okText: "Submit",
    cancelText: "Previous"
  }
];

class EditTaxonModal extends React.Component {
  state = {
    visible: true,
    confirmLoading: false,
    taxon: null,
    current: 0,
    selectedRank: null
  };

  componentDidMount = () => {
    this.getTaxon();
  };

  isAboveSpeciesAggregate = rank => {
    return this.props.rank.indexOf(rank) < this.props.rank.indexOf("species aggregate");
  };
  isInfraSpecific = rank => {
    return this.props.rank.indexOf(rank) > this.props.rank.indexOf("species");
  }
  handleSubmit = e => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const {
          taxon: { name }
        } = this.state;
        removeEmptyValues(values)
        const updatedName = { ...name, ...values };
        this.submitData(updatedName);
      } else {
          this.setState({current: this.state.current -1})
      }
    });
  };

  submitData = updatedName => {
    const {
      taxon: { name }
    } = this.state;
    axios
      .put(
        `${config.dataApi}dataset/${name.datasetKey}/name/${name.id}`,
        updatedName
      )
      .then(res => {
        this.setState({ submissionError: null, confirmLoading: false }, () => {
          notification.open({
            message: "Name updated",
            description: `${updatedName.scientificName} was updated`
          });
          if (
            this.props.onSuccess &&
            typeof this.props.onSuccess === "function"
          ) {
            this.props.onSuccess();
          }
        });
      })
      .catch(err => {
        this.setState({ submissionError: err, confirmLoading: false });
      });
  };
  getTaxon = () => {
    const { taxon } = this.props;
    axios(
      `${config.dataApi}dataset/${taxon.datasetKey}/taxon/${encodeURIComponent(
        taxon.id
      )}`
    ).then(tx => {
      this.setState({
        taxon: tx.data,
        suggestedNameValue: `${_.get(tx, "data.name.scientificName")}${
          _.get(tx, "data.name.authorship")
            ? " " + _.get(tx, "data.name.authorship")
            : ""
        }`
      });
    });
  };

  parseName = () => {
    const { suggestedNameValue } = this.state;
    axios(`${config.dataApi}/parser/name?name=${suggestedNameValue}`).then(
      res => {
        this.setState({ parsedName: _.get(res, 'data[0].name'), selectedRank: _.get(res, 'data[0].name.rank') });
      }
    );
  };

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };
  next = () => {
    const current = this.state.current + 1;
    this.setState({ current });
  }

  prev = () => {
    const current = this.state.current - 1;
    this.setState({ current });
  }
  render() {
    const {
      rank,
      nomstatus,
      onCancel,
      form: { getFieldDecorator }
    } = this.props;
    const {
      visible,
      submissionError,
      taxon,
      current,
      suggestedNameValue,
      parsedName,
      selectedRank
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };
    return (
      <Modal
        style={{ width: "650px" }}
        title={
          <span>
            Edit{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: _.get(taxon, "name.scientificName")
              }}
            />
          </span>
        }
        visible={visible}
        okText={steps[current].okText}
        onOk={() => {
            this.handleSubmit();
            this.next();
        }}
        confirmLoading={this.state.confirmLoading}
        cancelText={steps[current].cancelText}
        onCancel={onCancel}
        destroyOnClose={true}
        footer={current === 0 ? [
            <Button key="back" onClick={onCancel}>
              Cancel
            </Button>,
            <Button key="submit" type="primary"  onClick={() => {
                this.parseName();
                this.next();
            }}>
              Parse name
            </Button>,
          ] : [
            <Button key="cancel" onClick={onCancel}>
              Cancel
            </Button>,
            <Button key="back" onClick={this.prev}>
            Previous
          </Button>,
            <Button key="submit" type="primary" loading={this.state.confirmLoading} onClick={() => {
                this.handleSubmit();
                this.setState({ confirmLoading: true, current: current + 1 });
            }}>
              Submit
            </Button>,
          ]}
      >
        <Steps current={current} style={{ marginBottom: "10px" }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        {current === 0 && (
          <Input
            value={suggestedNameValue}
            onChange={e =>
              this.setState({ suggestedNameValue: e.target.value })
            }
            allowClear
          />
        )}
        {current === 1 && (
          <Form>
            <FormItem {...formItemLayout} label="Scientific name">
              {getFieldDecorator("scientificName", {
                initialValue: _.get(parsedName, "scientificName")
                  ? _.get(parsedName, "scientificName")
                  : "",

                rules: [
                  {
                    required: true,
                    message: "Please input Full Taxon name"
                  }
                ]
              })(<Input />)}
            </FormItem>
          { this.isAboveSpeciesAggregate(selectedRank) &&  <FormItem {...formItemLayout} label="Uninomial">
              {getFieldDecorator("uninomial", {
                initialValue: _.get(parsedName, "uninomial")
                  ? _.get(parsedName, "uninomial")
                  : ""
              })(<Input />)}
            </FormItem> }
            { !this.isAboveSpeciesAggregate(selectedRank)  &&    <FormItem {...formItemLayout} label="Genus">
              {getFieldDecorator("genus", {
                initialValue: _.get(parsedName, "genus")
                  ? _.get(parsedName, "genus")
                  : ""
              })(<Input />)}
            </FormItem>}
            { !this.isAboveSpeciesAggregate(selectedRank)  &&  <FormItem {...formItemLayout} label="Specific Epithet">
              {getFieldDecorator("specificEpithet", {
                initialValue: _.get(parsedName, "specificEpithet")
                  ? _.get(parsedName, "specificEpithet")
                  : ""
              })(<Input />)}
            </FormItem>}
            { this.isInfraSpecific(selectedRank)  &&  <FormItem {...formItemLayout} label="Infrasp. Epithet">
              {getFieldDecorator("infraspecificEpithet", {
                initialValue: _.get(parsedName, "infraspecificEpithet")
                  ? _.get(parsedName, "infraspecificEpithet")
                  : ""
              })(<Input />)}
            </FormItem>}
            <FormItem {...formItemLayout} label="Authorship">
              {getFieldDecorator("authorship", {
                initialValue: _.get(parsedName, "authorship")
                  ? _.get(parsedName, "authorship")
                  : ""
              })(<Input />)}
            </FormItem>
            <FormItem {...formItemLayout} label="Rank">
              {getFieldDecorator("rank", {
                initialValue: _.get(taxon, "name.rank")
                  ? _.get(taxon, "name.rank")
                  : "",

                rules: [
                  {
                    required: true,
                    message: "Please select Taxon rank"
                  }
                ]
              })(
                <Select style={{ width: 200 }} 
                  onChange={
                    (value) => this.setState({selectedRank: value}, () => this.props.form.setFieldsValue({rank: value}))
                  } showSearch>
                  {rank.map(r => (
                    <Option key={r} value={r}>
                      {r}
                    </Option>
                  ))}
                </Select>
              )}
            </FormItem>
            <FormItem {...formItemLayout} label="Nom. status">
              {getFieldDecorator("nomstatus", {
                initialValue: _.get(taxon, "name.nomStatus")
                  ? _.get(taxon, "name.nomStatus")
                  : ""
              })(
                <Select style={{ width: 200 }} showSearch>
                  {nomstatus.map(r => (
                    <Option key={r} value={r}>
                      {r}
                    </Option>
                  ))}
                </Select>
              )}
            </FormItem>
            {submissionError && (
              <FormItem>
                <Alert
                closable
                onClose={() => this.setState({ submissionError: null })}
                  message={<ErrorMsg error={submissionError} />}
                  type="error"
                />
              </FormItem>
            )}
          </Form>
        )}
      </Modal>
    );
  }
}
const mapContextToProps = ({ rank, nomstatus }) => ({ rank, nomstatus });
const WrappedAddTaxonModal = Form.create()(
  withContext(mapContextToProps)(EditTaxonModal)
);

export default WrappedAddTaxonModal;
