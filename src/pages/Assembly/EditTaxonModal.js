import React from "react";
import { Form, Input, Modal, Select, Alert, notification } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const Option = Select.Option;
const FormItem = Form.Item;
class EditTaxonModal extends React.Component {
  state = {
    visible: true,
    confirmLoading: false,
    taxon: null
  };

  componentDidMount = () => {
      this.getTaxon()
  }

  isGenusOrAbove = (rank) =>{
    return this.props.rank.indexOf(rank) <= this.props.rank.indexOf('genus')
  }

  handleSubmit = e => {
    
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
        const taxon = {
          name:  {
            scientificName: values.name,
            rank: values.rank,
            nomstatus: values.nomstatus

          }
        }
        this.submitData(taxon);
      } else {

      }
    });
  };

  submitData = values => {
    const { taxon: {name} } = this.state;
    axios
      .put(`${config.dataApi}dataset/${name.datasetKey}/name/${name.id}`, values)
      .then(res => {

        this.setState({ submissionError: null, confirmLoading: false }, () => {
            notification.open({
                message: "Name updated",
                description: `${name.scientificName} was updated`
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
  getTaxon = () => {
    const {
      taxon
    } = this.props;
    axios(
      `${config.dataApi}dataset/${taxon.datasetKey}/taxon/${encodeURIComponent(taxon.id)}`
    ).then((tx) => {
        this.setState({taxon: tx.data})
    })
  }

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  render() {
    const {  rank, nomstatus, onCancel, form: {getFieldDecorator}  } = this.props;
    const { visible, submissionError, taxon } = this.state;
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
            Edit{" "}
            <span dangerouslySetInnerHTML={{ __html: _.get(taxon, 'name.scientificName') }} />
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
        initialValue: (_.get(taxon, 'name.scientificName')) ? _.get(taxon, 'name.scientificName') : '',

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
                      initialValue: (_.get(taxon, 'name.rank')) ? _.get(taxon, 'name.rank') : '',

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
        <FormItem {...formItemLayout} label="Nom. status">
          {getFieldDecorator("nomstatus", {
            
            initialValue: (_.get(taxon, 'name.nomStatus')) ? _.get(taxon, 'name.nomStatus') : '',

            
          })(
            <Select style={{ width: 200 }}  showSearch>
          
              {nomstatus.map(r => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          )}
        </FormItem>
        {submissionError && <FormItem><Alert message={<ErrorMsg error={submissionError}></ErrorMsg>} type="error" /></FormItem>}
        </Form>
      </Modal>
    );
  }
}
const mapContextToProps = ({ rank, nomstatus }) => ({ rank, nomstatus });
const WrappedAddTaxonModal = Form.create()(
  withContext(mapContextToProps)(EditTaxonModal)
);

export default WrappedAddTaxonModal;
