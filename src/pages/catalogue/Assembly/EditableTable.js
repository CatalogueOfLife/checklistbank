import React, { useState, useEffect } from 'react';
import { Table, Select, Input, InputNumber, Popconfirm, Form } from 'antd';
import _ from "lodash";
import withContext from "../../../components/hoc/withContext";
import axios from "axios";
import config from "../../../config";
const Option = Select.Option

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
 const getInput = () => {
    if (dataIndex === "estimate") {
      return <InputNumber />;
    } else if(dataIndex === "type"){
        return <Select showSearch>
            {['described species living', 'described species fossil', 'estimated species'].map(o => <Option key={o} value={o}>{o}</Option>)}
        </Select>
    }
    return <Input />;
  };
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: ['estimate', 'type'].indexOf(dataIndex) > -1,
              message: `Please Input ${title}!`
            }
          ]}
        >
          {getInput()}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const EditableTable = (props) => {
  const [form] = Form.useForm();
  const [data, setData] = useState(props.data);
  const [editingKey, setEditingKey] = useState('');
  useEffect(() => {
    const { data } = props;
    if (data.length > 0 ) {
      decorateEstimatesWithReference(data);
    }
           
  }, [props.data.length]); 

  const isEditing = record => record.id === editingKey;

  const edit = record => {
     form.setFieldsValue({
      estimate: '',
      type: '',
      note: '',
      ...record,
    }); 
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey('');
  };
  const decorateEstimatesWithReference = (data) => {
    const {catalogueKey} = props;
    if (_.isArray(data)) {
        Promise.all(
          data.filter(a => !_.isUndefined(a.referenceId)).map(d =>
            axios(
              `${config.dataApi}dataset/${
                catalogueKey
              }/reference/${d.referenceId}`
            ).then(res => {
                d.reference = res.data.citation
            }).catch(err => {
                // 
            })
          )
        ).then(() => {
            setData(data)
        });
      } 
  }
  const save = async id => {
    const {catalogueKey} = props;
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex(item => id === item.id);
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...row
      });
      
      try{
        await axios.put(`${config.dataApi}dataset/${catalogueKey}/estimate/${id}`, {...item, ...row})
       if(typeof props.onDataUpdate === 'function'){
        props.onDataUpdate(newData)
    }
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);
        setEditingKey('');
      } catch (err){
        alert(err)
        setEditingKey('');
      }  
    
    
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns = [
    {
      title: "estimate",
      dataIndex: "estimate",
      width: "25%",
      editable: true,
      render: (text, record) => text ? text.toLocaleString('en-GB') : ""
    },

    {
      title: "reference",
      dataIndex: "reference",
      width: "50%",
      editable: false
    },
    {
      title: "type",
      dataIndex: "type",
      width: "50%",
      editable: true
    },
    {
      title: "note",
      dataIndex: "note",
      width: "50%",
      editable: true
    },
    {
        title: 'operation',
        dataIndex: 'operation',
        render: (_, record) => {
          const editable = isEditing(record);
          return editable ? (
            <span>
              <a
                onClick={() => save(record.id)}
                style={{
                  marginRight: 8,
                }}
              >
                Save
              </a>
              <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                <a>Cancel</a>
              </Popconfirm>
            </span>
          ) : (
            <a disabled={editingKey !== ''} onClick={() => edit(record)}>
              Edit
            </a>
          );
        },
      }
  ];
  const mergedColumns = columns.map(col => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: record => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });
  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: cancel,
        }}
      />
    </Form>
  );
};

const mapContextToProps = ({ estimateType }) => ({ estimateType });

export default withContext(mapContextToProps)(EditableTable);