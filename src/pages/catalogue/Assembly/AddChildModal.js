import React, {useState} from "react";
import { Input, Modal, Select, Alert, Checkbox, notification, Form } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";

const Option = Select.Option;
const FormItem = Form.Item;

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


const AddChildModal = (props) => {
  const { parent, rank, onCancel } = props;
  const [visible, setVisible] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [submissionError, setSubmissionError]  = useState(null);
  const [form] = Form.useForm();

  const isGenusOrAbove = (rank) =>{
    return props.rank.indexOf(rank) <= props.rank.indexOf('genus')
  }
  const handleSubmit = values => {
    const {parent} = props;
          
        let taxon = {
          status: values.provisional ? "provisionally accepted" : "accepted",
          name: isGenusOrAbove(values.rank) ? {
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
        submitData(taxon);
     
  
  };
  const submitData = values => {
    const { parent, catalogueKey } = props;
    axios
      .post(`${config.dataApi}dataset/${parent ? parent.datasetKey : catalogueKey}/taxon`, values)
      .then(res => {
        setSubmissionError(null)
        setConfirmLoading(false)
          notification.open({
            message: _.get(parent, 'id') ? "Child inserted" : "Root taxon created",
            description: _.get(parent, 'id') ? `${_.get(values, 'name.uninomial') || _.get(values, 'name.scientificName')} was inserted as child of ${_.get(parent, 'name')}` : `${_.get(values, 'name.uninomial') || _.get(values, 'name.scientificName')} was created as root`
          });
          if(props.onSuccess && typeof props.onSuccess === 'function'){
            props.onSuccess()
          }
        
      })
      .catch(err => {
        setConfirmLoading(false)
        setSubmissionError(err)
      });
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
        setConfirmLoading(true)
        form
          .validateFields()
          .then(values => {
            form.resetFields();
            handleSubmit(values);
          })
      }}
      confirmLoading={confirmLoading}
      onCancel={() => {
        setVisible(false)
        if(onCancel && typeof onCancel === 'function'){
          onCancel()
        }
      }}
      destroyOnClose={true}
    >
    <Form form={form}>
      <FormItem {...formItemLayout} label="Taxon name" name="name" rules={[
            {
              required: true,
              message: "Please input Taxon name"
            }
          ]}>
        <Input autoFocus />
      </FormItem>
      <FormItem {...formItemLayout} label="Rank" name="rank" rules={[
            {
              required: true,
              message: "Please select Taxon rank"
            }
          ]}>
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
      </FormItem>
      {<FormItem
        {...formItemLayout}
        label="Provisional"
        name="provisional"
        valuePropName="checked"
        initialValue={false}
      >
        <Checkbox />
      </FormItem>}
      {submissionError && <FormItem><Alert 
      closable
      onClose={() => setSubmissionError(null)}
      message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" /></FormItem>}
      </Form>
    </Modal>
  );

}



const mapContextToProps = ({ rank, nomstatus }) => ({ rank, nomstatus });

export default withContext(mapContextToProps)(AddChildModal)
