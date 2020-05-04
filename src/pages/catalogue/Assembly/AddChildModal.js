import React from "react";
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Input, Modal, Select, Alert, Checkbox, notification } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";

const Option = Select.Option;
const FormItem = Form.Item;
class AddChildModal extends React.Component {
  state = {
    visible: true,
    confirmLoading: false
  };

  nameInputRef = React.createRef()

  isGenusOrAbove = (rank) =>{
    return this.props.rank.indexOf(rank) <= this.props.rank.indexOf('genus')
  }

  handleSubmit = e => {
    const {parent} = this.props;
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let taxon = {
          status: values.provisional ? "provisionally accepted" : "accepted",
          name: this.isGenusOrAbove(values.rank) ? {
            uninomial: values.name,
            rank: values.rank
          } : {
            scientificName: values.name,
            rank: values.rank

          }
        }

        if(_.get(parent, 'id')){
          taxon.parentId = parent.id
        }
        this.submitData(taxon);
      } else {

      }
    });
  };

  submitData = values => {
    const { parent, catalogueKey } = this.props;
    axios
      .post(`${config.dataApi}dataset/${parent ? parent.datasetKey : catalogueKey}/taxon`, values)
      .then(res => {

        this.setState({ submissionError: null, confirmLoading: false }, () => {
          notification.open({
            message: _.get(parent, 'id') ? "Child inserted" : "Root taxon created",
            description: _.get(parent, 'id') ? `${_.get(values, 'name.uninomial') || _.get(values, 'name.scientificName')} was inserted as child of ${_.get(parent, 'name')}` : `${_.get(values, 'name.uninomial') || _.get(values, 'name.scientificName')} was created as root`
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
    const { parent, rank, onCancel, form: {getFieldDecorator}  } = this.props;
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
          _.get(parent, 'id') ?  <span>
            Add child to{" "}
            <span dangerouslySetInnerHTML={{ __html: parent.name }} />
          </span> : <span>Create root taxon</span>
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
          })(<Input autoFocus />)}
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
