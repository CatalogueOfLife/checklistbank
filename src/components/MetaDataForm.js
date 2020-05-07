import React, {useState, useEffect} from "react";
import { Input, InputNumber, Select, Button, Alert, Rate, notification, Row, Col , Form} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../config";
import TextArea from "antd/lib/input/TextArea";
import ErrorMsg from "../components/ErrorMsg";
import TagControl from "./TagControl";
import CsvDelimiterInput from "./CsvDelimiterInput"
import withContext from "./hoc/withContext";

const FormItem = Form.Item;
const Option = Select.Option;
const openNotification = (title, description) => {
  notification.open({
    message: title,
    description: description
  });
};

const formItemLayout = {
  labelCol: {
    xs: { span: 20 },
    sm: { span: 4 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 }
  }
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0
    },
    sm: {
      span: 16,
      offset: 4
    }
  }
};

const MetaDataForm = (props) => {

  const {
    data,
    frequencyEnum,
    datasettypeEnum,
    dataformatEnum,
    licenseEnum,
    nomCode,
    datasetSettings,
    datasetoriginEnum,
    onSaveSuccess
  } = props;

  const [confirmDirty, setConfirmDirty] = useState(false)
  const [origin, setOrigin] = useState(null)
  const [submissionError, setSubmissionError] = useState(null)
  const [form] = Form.useForm();
  useEffect(() => {
    setOrigin(data.origin)
  }, [data.origin]);
  
  const onFinishFailed = ({ errorFields }) => {
    form.scrollToField(errorFields[0].name);
  };
  const submitData = values => {
    const key = _.get(data, "key");
   // const { onSaveSuccess } = this.props;
    if(_.get(values, 'settings["csv delimiter"]') === "\\t"){
      values.settings["csv delimiter"] = `\t`
    }
    let task = key
      ? axios.put(`${config.dataApi}dataset/${key}`, values)
      : axios.post(`${config.dataApi}dataset`, values);

    task
      .then(res => {
        let title = key ? "Meta data updated" : "Dataset registered";
        let msg = key
          ? `Meta data updated successfully updated for ${values.title}`
          : `${values.title} registered and ready for import`;
          if (onSaveSuccess && typeof onSaveSuccess === "function") {
            onSaveSuccess(res);
          }
          openNotification(title, msg);
          setSubmissionError(null)
      })
      .catch(err => {
        setSubmissionError(err)
      });
  };

  const handleConfirmBlur = e => {
    const value = e.target.value;
    setConfirmDirty(confirmDirty || !!value)
  };

  const initialValues = {organisations: [], authorsAndEditors: [], private: false, confidence: null, completeness: 0, ...data}

  return (
    <Form initialValues={initialValues} onFinish={submitData} onFinishFailed={onFinishFailed} style={{ paddingTop: "12px" }}>
   
      {submissionError && (
        <FormItem>
          <Alert
            closable
            onClose={() => setSubmissionError(null)}
            message={<ErrorMsg error={submissionError}></ErrorMsg>}
            type="error"
          />
        </FormItem>
      )}

      <FormItem {...formItemLayout} label="Title" name="title" rules={[
            {
              required: true,
              message: "Please input dataset title"
            }
          ]}>
        <Input />
      </FormItem>
      {data && (
        <FormItem
          {...formItemLayout}
          label="Alias"
          name="alias"
          help="Abbreviated or shortened memorable name of the dataset intended for easy use in day-to-day communications, as supplied by the custodian"
        >
          <Input />
        </FormItem>
      )}
      {data && (
        <FormItem {...formItemLayout} label="Organisations" name="organisations">
          <TagControl label="New organisation" removeAll={true} />
        </FormItem>
      )}

      {data && (
        <FormItem {...formItemLayout} label="Description" name="description">
          <TextArea rows={6} />
        </FormItem>
      )}

      {data && (
        <FormItem {...formItemLayout} label="Version" name="version">
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem {...formItemLayout} label="Received by CoL" name="released">
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem {...formItemLayout} label="Contact" name="contact">
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem {...formItemLayout} label="Authors and Editors" name="authorsAndEditors">
          <TagControl label="New person" removeAll={true} />
        </FormItem>
      )}
      {data && (
        <FormItem {...formItemLayout} label="Website" name="website">
          <Input type="url" />
        </FormItem>
      )}
      { !data && <FormItem {...formItemLayout} label="Dataset Origin" name="origin" rules={[
                    {
                      required: true,
                      message: "Please select the dataset origin"
                    }
                  ]} help="This cannot be changed later"
>
    <Select
                    style={{ width: 200 }}
                    onChange={value => this.setState({ origin: value })}
                    showSearch
                  >
                    {datasetoriginEnum.map(f => {
                      return (
                        <Option key={f} value={f}>
                          {f}
                        </Option>
                      );
                    })}
                  </Select>
              </FormItem>
      }


      {(origin === "external" || origin === "managed") && (
        <FormItem {...formItemLayout} label="Data Format" name="dataFormat">
          <Select style={{ width: 200 }} showSearch>
              {dataformatEnum.map(f => {
                return (
                  <Option key={f} value={f}>
                    {f}
                  </Option>
                );
              })}
            </Select>
        </FormItem>
      )}
      {origin === "external" && (
        <FormItem {...formItemLayout} label="Data Access" name="dataAccess" rules={[
          {
            required: false,
            message: "Please input the url to access data from"
          }
        ]}>
          <Input type="url" />
        </FormItem>
      )}
      {origin === "external" && (
        <FormItem {...formItemLayout} label="Automated Import Frequency" name="importFrequency" rules={[
          {
            required: true,
            message: "Please select import frequency"
          }
        ]}>
          <Select style={{ width: 200 }} showSearch>
              {frequencyEnum.map(f => {
                return (
                  <Option key={f} value={f}>
                    {f}
                  </Option>
                );
              })}
            </Select>
        </FormItem>
      )}
      <FormItem {...formItemLayout} label="Dataset Type" name="type" rules={[
            {
              required: true,
              message: "Please select a dataset type"
            }
          ]}>
        <Select style={{ width: 200 }} showSearch>
            {datasettypeEnum.map(f => {
              return (
                <Option key={f} value={f}>
                  {f}
                </Option>
              );
            })}
          </Select>
      </FormItem>

      {data && (
        <FormItem
          {...formItemLayout}
          label="Taxonomic coverage (english)"
          help="English name of the taxon covered by the dataset"
          name="group"
        >
          <Input />
        </FormItem>
      )}
      {data && (
        <FormItem {...formItemLayout} label="Geographic scope" name="geographicScope">
          <Input type="text" />
        </FormItem>
      )}
      {data && (
        <FormItem {...formItemLayout} label="Citation" name="citation">
          <Input type="text" />
        </FormItem>
      )}
      <FormItem {...formItemLayout} label="Private" key="Private" name="private" valuePropName="checked">
      <Input type="checkbox"  /> 
          </FormItem>
      <FormItem {...formItemLayout} label="License" name="license" rules={[
            {
              required: true,
              message: "Please select a license"
            }
          ]}>
        <Select style={{ width: 200 }} showSearch>
            {licenseEnum.map(f => {
              return (
                <Option key={f} value={f}>
                  {f}
                </Option>
              );
            })}
          </Select>
      </FormItem>

      {/* Only to be shown on existing datasets */}
      {data && (
        <React.Fragment>
          <FormItem {...formItemLayout} label="Logo Url" name="logo">
          <Input type="url" />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="Checklist Confidence"
            name="confidence"
            help={
              <span>
                Quality of taxonomic checklist with values 1 to 5; quality is
                stated by the custodian in agreement with CoL editor.
                Confidence indicators are described at{" "}
                <a
                  href="http://www.catalogueoflife.org/col/info/databases"
                  target="_blank"
                >
                  http://www.catalogueoflife.org/col/info/databases
                </a>
              </span>
            }
          >
            <Rate />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="Completeness"
            name="completeness"
            help="Percentage of completeness of species list of the taxon provided by the dataset"
          >
            <Input type="number" min="0" max="100" />
          </FormItem>

          <FormItem {...formItemLayout} label="Notes" name="notes">
            <TextArea rows={3} />
          </FormItem>
        </React.Fragment>
      )}
      <Row>
        <Col span={4}></Col>
        <Col span={16}>
        <section className="code-box">
        <div className="code-box-title">Settings</div>
      </section>
        </Col>
        
        
      </Row>
      {datasetSettings.filter(s => s.type === "Boolean").map(s => 
            <FormItem {...formItemLayout} label={_.startCase(s.name)} key={s.name} name={['settings', s.name]} valuePropName='checked'>
            <Input type="checkbox"  />
          </FormItem>
          )}
          <FormItem {...formItemLayout} label={_.startCase("csv delimiter")} key={"csv delimiter"} name={['settings', "csv delimiter"]}>
            <CsvDelimiterInput/> 
          </FormItem>
      {datasetSettings.filter(s => (s.type === "String" || s.type === "Integer") && s.name !== "csv delimiter").map(s => 
            <FormItem {...formItemLayout} label={_.startCase(s.name)} key={s.name} name={['settings', s.name]}>
            {s.type === "String" ? <Input type="text" /> :
                <InputNumber />}
          </FormItem>
          )}

      {datasetSettings.filter(s => !["String", "Integer", "Boolean"].includes(s.type)).map(s => 
            <FormItem {...formItemLayout} label={_.startCase(s.name)} key={s.name} name={['settings', s.name]}>
              {s.type === "NomCode" ? <Select style={{ width: 200 }} showSearch>
              {nomCode.map(c => {
                return (
                  <Option
                    key={c.name}
                    value={c.name}
                  >{`${c.name} (${c.acronym})`}</Option>
                );
              })}
            </Select> :
              <Select style={{ width: 200 }} showSearch>
            {props[_.camelCase(s.type)].map(e => {
              return (
                <Option key={e.name} value={e.name}>
                  {e.name}
                </Option>
              );
            })}
          </Select>}
          </FormItem>
          )}
      
      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </FormItem>
    </Form>
  );

}



const mapContextToProps = ({
  addError,
  addInfo,
  frequency: frequencyEnum,
  datasetType: datasettypeEnum,
  dataFormatType: dataformatEnum,
  datasetOrigin: datasetoriginEnum,
  license: licenseEnum,
  nomCode,
  datasetSettings,
  gazetteer
}) => ({
  addError,
  addInfo,
  frequencyEnum,
  datasettypeEnum,
  dataformatEnum,
  datasetoriginEnum,
  licenseEnum,
  nomCode,
  datasetSettings,
  gazetteer
});


export default withContext(mapContextToProps)(MetaDataForm);
