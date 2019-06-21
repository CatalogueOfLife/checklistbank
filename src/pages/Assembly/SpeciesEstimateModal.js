import React from "react";
import { Form, Input, Modal, Select, Alert, List, Icon, notification } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import EditableTable from "./EditableTable"
import _ from "lodash";
import axios from "axios";
import config from "../../config";
const { MANAGEMENT_CLASSIFICATION } = config;


const FormItem = Form.Item;
class SpeciesestimateModal extends React.Component {
  state = {
    visible: true,
    addNewMode: false,
    submissionError: null
  };


  handleSubmit = e => {

    this.props.form.validateFieldsAndScroll((err, values) => {
        if (!err) {
            console.log("Received values of form: ", values);
            
            this.submitData(
               values
                );
          } else {
            this.setState({submissionError: err})
          }
    });
  };

  submitData = values => {
    const { taxon } = this.props;
  
    axios(`${config.dataApi}dataset/${MANAGEMENT_CLASSIFICATION.key}/taxon/${taxon.id}`)
      .then(tx => axios.post(`${config.dataApi}estimate`, {...values,
        subject: {
            id: _.get(tx, "data.name.id"),
    
            name: _.get(tx, "data.name.scientificName"),
            authorship: _.get(tx, "data.name.authorship"),
            rank: _.get(tx, "data.name.rank")
          }
    }))
      
      .then(res => {

        this.setState({ submissionError: null }, () => {
          notification.open({
            message: "Estimate created",
            description: `${values.estimate} est. species`
          });
          if(this.props.onSuccess && typeof this.props.onSuccess === 'function'){
            this.props.onSuccess()
          }
        });
      })
      .catch(err => {
        this.setState({ submissionError: err });
      });
  };

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  toggleEdit = () => {
    const { addNewMode } = this.state;
    this.setState({ addNewMode: !addNewMode });
  };

  render() {
    const { taxon, onCancel, form: {getFieldDecorator}  } = this.props;
    const {estimates} = taxon;
    const { visible, addNewMode, submissionError } = this.state;
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
            Estimates for{" "}
            <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
          </span>
        }
        visible={visible}
        onOk={() => {
          this.handleSubmit()
        }}
        onCancel={() => {
          this.setState({ visible: false }, onCancel);
        }}
        destroyOnClose={true}
      >
         {!addNewMode && <a onClick={this.toggleEdit}><Icon type="plus"  /> Add new</a>} 
   { addNewMode &&   <Form >
        <FormItem {...formItemLayout} label="Estimate">
          {getFieldDecorator("estimate", {
            rules: [
              {
                required: true,
                message: "Estimate"
              }
            ]
          })(<Input />)}
        </FormItem>
        <FormItem {...formItemLayout} label="Reference ID">
          {getFieldDecorator("referenceId", {
            rules: [
              {
                required: true,
                message: "referenceId"
              }
            ]
          })(<Input />)}
        </FormItem>
        
       
        {submissionError && <FormItem><Alert message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" /></FormItem>}
        </Form> }

            {estimates && _.isArray(estimates) && 
            
                <EditableTable data={estimates} />}

      </Modal>
    );
  }
}
const mapContextToProps = ({ rank, nomstatus }) => ({ rank, nomstatus });
const WrappedSpeciesestimateModal = Form.create()(
  withContext(mapContextToProps)(SpeciesestimateModal)
);

export default WrappedSpeciesestimateModal;
