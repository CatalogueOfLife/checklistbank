import React from "react";
import axios from "axios";
import config from "../../config";
import { Table, Input, InputNumber, Popconfirm, Form } from "antd";
import _ from "lodash";
const { MANAGEMENT_CLASSIFICATION } = config;

const EditableContext = React.createContext();

class EditableCell extends React.Component {
  getInput = () => {
    if (this.props.inputType === "number") {
      return <InputNumber />;
    }
    return <Input />;
  };

  renderCell = ({ getFieldDecorator }) => {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item style={{ margin: 0 }}>
            {getFieldDecorator(dataIndex, {
              rules: [
                {
                  required: true,
                  message: `Please Input ${title}!`
                }
              ],
              initialValue: record[dataIndex]
            })(this.getInput())}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  render() {
    return (
      <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
    );
  }
}

class EditableTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [], editingKey: "" };
    this.columns = [
      {
        title: "estimate",
        dataIndex: "estimate",
        width: "25%",
        editable: true,
        render: (text, record) => text.toLocaleString('en-GB')
      },

      {
        title: "reference",
        dataIndex: "reference",
        width: "50%",
        editable: true
      },
      {
        title: "operation",
        dataIndex: "operation",
        render: (text, record) => {
          const { editingKey } = this.state;
          const editable = this.isEditing(record);
          return editable ? (
            <span>
              <EditableContext.Consumer>
                {form => (
                  <a
                    href="javascript:;"
                    onClick={() => this.save(form, record.key)}
                    style={{ marginRight: 8 }}
                  >
                    Save
                  </a>
                )}
              </EditableContext.Consumer>
              <Popconfirm
                title="Sure to cancel?"
                onConfirm={() => this.cancel(record.key)}
              >
                <a>Cancel</a>
              </Popconfirm>
            </span>
          ) : (
            <span>
              <a
                disabled={editingKey !== ""}
                onClick={() => this.edit(record.key)}
              >
                Edit
              </a>
              {" | "}
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => this.delete(record.key)}
              >
                <a>Delete</a>
              </Popconfirm>
            </span>
          );
        }
      }
    ];
  }

  componentWillMount = () => {
    const { data } = this.props;

    this.decorateEstimatesWithReference(data);
    
  };

  decorateEstimatesWithReference = (data) => {
    if (_.isArray(data)) {
        Promise.all(
          data.map(d =>
            axios(
              `${config.dataApi}dataset/${
                MANAGEMENT_CLASSIFICATION.key
              }/reference/${d.referenceId}`
            ).then(res => {
                d.reference = res.data.citation
            })
          )
        ).then(() => {
            this.setState({ data })
        });
      } else {
        this.setState({ data: [] });
      }
  }
  isEditing = record => record.key === this.state.editingKey;

  cancel = () => {
    this.setState({ editingKey: "" });
  };

  save = (form, key) => {
    form.validateFields((error, row) => {
      if (error) {
        return;
      }
      const newData = [...this.state.data];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row
        });
        this.setState({ data: newData, editingKey: "" });
      } else {
        newData.push(row);
        this.setState({ data: newData, editingKey: "" });
      }
    });
  };

  edit = key => {
    this.setState({ editingKey: key });
  };

  render = () => {
    const components = {
      body: {
        cell: EditableCell
      }
    };

    const columns = this.columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          inputType: col.dataIndex === "estimate" ? "number" : "text",
          dataIndex: col.dataIndex,
          title: col.title,
          editing: this.isEditing(record)
        })
      };
    });

    return (
      <EditableContext.Provider value={this.props.form}>
        <Table
          components={components}
          bordered
          dataSource={this.state.data}
          columns={columns}
          rowClassName="editable-row"
          pagination={{
            onChange: this.cancel
          }}
        />
      </EditableContext.Provider>
    );
  };
}

const EditableFormTable = Form.create()(EditableTable);

export default EditableFormTable;
