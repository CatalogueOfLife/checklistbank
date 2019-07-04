import React from "react";
import { Form, Input, Modal, Select, Alert, Checkbox, notification } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const Option = Select.Option;
const FormItem = Form.Item;
class AddChildModal extends React.Component {
  state = {
    visible: true,
    confirmLoading: false
  };

  isGenusOrAbove = (rank) =>{
    return this.props.rank.indexOf(rank) <= this.props.rank.indexOf('genus')
  }

  handleSubmit = e => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
        const taxon = {
          parentId: this.props.parent.id,
          status: values.provisional ? "provisionally accepted" : "accepted",
          name: this.isGenusOrAbove(values.rank) ? {
            uninomial: values.name,
            rank: values.rank
          } : {
            scientificName: values.name,
            rank: values.rank

          }
        }
        this.submitData(taxon);
      } else {

      }
    });
  };

  submitData = values => {
    const { parent } = this.props;
    axios
      .post(`${config.dataApi}dataset/${parent.datasetKey}/taxon`, values)
      .then(res => {

        this.setState({ submissionError: null, confirmLoading: false }, () => {
          notification.open({
            message: "Child inserted",
            description: `${values.name} was inserted as child of ${parent.name}`
          });
          if(this.props.onSuccess && typeof this.props.onSuccess === 'function'){
            this.props.onSuccess()
          }
        });
      })
      .catch(err => {
        this.setState({ submissionError: err, confirmLoading: false });
      });
  };

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  render() {
    const { parent, rank, nomstatus, onCancel, form: {getFieldDecorator}  } = this.props;
    const { visible, submissionError } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 },
      },
    };
    return (
      <Modal
      style={{width:"650px"}}
        title={
          <span>
            Add child to{" "}
            <span dangerouslySetInnerHTML={{ __html: parent.name }} />
          </span>
        }
        visible={visible}
        onOk={() => {
          this.setState({ confirmLoading: true });
          this.handleSubmit()
        }}
        confirmLoading={this.state.confirmLoading}
        onCancel={() => {
          this.setState({ visible: false }, onCancel);
        }}
        destroyOnClose={true}
      >
      <Form >
        <FormItem {...formItemLayout} label="Taxon name">
          {getFieldDecorator("name", {
            rules: [
              {
                required: true,
                message: "Please input Taxon name"
              }
            ]
          })(<Input />)}
        </FormItem>
        <FormItem {...formItemLayout} label="Rank">
          {getFieldDecorator("rank", {
            rules: [
              {
                required: true,
                message: "Please select Taxon rank"
              }
            ]
          })(
            <Select 
            style={{ width: 200 }}
            showSearch
            >
              {rank.map(r => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          )}
        </FormItem>
        {<FormItem
          {...formItemLayout}
          label="Provisional"
        >
          {getFieldDecorator('provisional', {
            initialValue: false,
            valuePropName: 'checked'
             
          })(
            <Checkbox />

              
          )}
        </FormItem>}
        {submissionError && <FormItem><Alert 
        closable
        onClose={() => this.setState({ submissionError: null })}
        message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" /></FormItem>}
        </Form>
      </Modal>
    );
  }
}
const mapContextToProps = ({ rank, nomstatus }) => ({ rank, nomstatus });
const WrappedAddChildModal = Form.create()(
  withContext(mapContextToProps)(AddChildModal)
);

export default WrappedAddChildModal;
