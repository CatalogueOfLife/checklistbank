import React, { useState, useEffect } from "react";
import { Checkbox, Popconfirm, Row, Col, Button, Tag , Typography, Table, Tooltip, notification} from "antd";
import { MinusCircleOutlined, CheckCircleOutlined} from "@ant-design/icons";
import DataLoader from "dataloader";
import axios from "axios";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import { getDatasetsBatch } from "../../../api/dataset";
import DatasetNavLink from "../../DatasetList/DatasetNavLink"
import DatasetAutocomplete from "../../catalogue/Assembly/DatasetAutocomplete";
const { Text } = Typography;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));


const UserRoles = ({ user, onChangeCallback, addError }) => {
  const [options, setOptions] = useState([
    { label: "Admin", value: "admin" },
    { label: "Editor", value: "editor" },
    { label: "Reviewer", value: "reviewer" },
  ]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [roles, setRoles] = useState([]);
  const [newRoles, setNewRoles] = useState(null);
  const [confirmText, setConfirmText] = useState("Change roles");
  const [dataset, setDataset] = useState(null);
  const [userDatasets, setUserDatasets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    /* setOptions([
      { label: "Admin", value: "admin" },
      {
        label: `Editor${
          user?.roles?.indexOf("editor") > -1
            ? " (" + (user?.editor?.length || 0) + ")"
            : ""
        }`,
        value: "editor",
      },
      {
        label: `Reviewer${
          user?.roles?.indexOf("reviewer") > -1
            ? " (" + (user?.reviewer?.length || 0) + ")"
            : ""
        }`,
        value: "reviewer",
      },
    ]); */
    setOptions([
      { label: "Admin", value: "admin" },
      {
        label: `Global Editor`,
        value: "editor",
      },
      {
        label: `Global Reviewer`,
        value: "reviewer",
      },
    ]);
    setRoles(user?.roles || []);
    getDatasetsForUser('editor')
    setLoading(false)
  }, [user]);

  const updateRoles = async (roles) => {
    setConfirmVisible(false);
    setLoading(true)
    try {
      await axios.put(`${config.dataApi}user/${user.key}/role`, roles, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setRoles(roles);
      setNewRoles(null);
      
      if (typeof onChangeCallback === "function") {
        onChangeCallback(roles);
      }
    } catch (err) {
      addError(err);
    }
  };

  const toggleBlock = async () => {
    const method = user?.blocked ? "delete" : "post";
    try {
      await axios[method](`${config.dataApi}user/${user.key}/block`);
      notification.success({
        message: method === 'post' ? `User blocked` : `User unblocked`,
        description: user?.username,
      });
      
      if (typeof onChangeCallback === "function") {
        setLoading(true)
        onChangeCallback();
      }
    } catch (err) {
      addError(err);
    }
  }

  const onChange = (checkedValues) => {
    setNewRoles(checkedValues);
    updateRoles(checkedValues);
  };

  const confirm = () => {
    updateRoles(newRoles);
  };

  const addEditor = async (_dataset, role = 'editor') => {
      try {
        setLoading(true)
        await axios.post(
          `${config.dataApi}dataset/${_dataset?.key}/${role}`,
          user?.key,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        notification.success({
          message: `Added ${role}`,
          description: user?.username,
        });
        if (typeof onChangeCallback === "function") {
          
          onChangeCallback();
        }
      } catch (err) {
        addError(err);
      }
    
  };

  const deleteEditor = async (_dataset, role = 'editor') => {
    try {
      setLoading(true)
      await axios.delete(
        `${config.dataApi}dataset/${_dataset?.key}/${role}/${user.key}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      notification.success({
        message: `Removed ${role}`,
        description: user?.username,
      });
      if (typeof onChangeCallback === "function") {
        
        onChangeCallback();
      }
    } catch (err) {
      addError(err);
    }
  };

  const getDatasetsForUser = async () => {
    try {
      setLoading(true)
      const keys =  new Set([...(user?.editor || []), ...(user?.reviewer || [])]) 
     const datasets = []  
     for (let key of keys){
      const dataset = await datasetLoader.load(key);
      datasets.push(dataset)
     }
     setUserDatasets(datasets)  
     setLoading(false)  
    } catch (error) {
      setLoading(false)
    }
  }

  return (
    <Popconfirm
      title={confirmText}
      visible={confirmVisible}
      // onVisibleChange={handleVisibleChange}
      onConfirm={confirm}
      onCancel={() => setConfirmVisible(false)}
    >
      <Row>
        <Col>
      <Checkbox.Group
        options={options}
        value={roles}
        visible={confirmVisible}
        onChange={onChange}
      />
      </Col>
      <Col flex="auto"></Col>
      <Col><Button type={user?.blocked ? 'primary' : 'danger'} onClick={toggleBlock}>{user?.blocked ? <CheckCircleOutlined /> : <MinusCircleOutlined />} {user?.blocked ? "Unblock" : "Block"} </Button></Col>
      </Row>

      <h3 style={{ marginTop: "10px" }}>{`Select a dataset to make ${user?.username} editor or reviewer`}</h3>
      <Row style={{ marginTop: "10px" }}>
        <DatasetAutocomplete
          onSelectDataset={setDataset}
          onResetSearch={() => setDataset(null)}
        />
      </Row>
      {dataset && (
        

        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col>
           { (!user?.editor || user?.editor?.indexOf(dataset.key) === -1) && <Button type="primary" onClick={() => addEditor(dataset, 'editor')}>{`Make ${user?.username} editor`}</Button>}
           { (!user?.reviewer || user?.reviewer?.indexOf(dataset.key) === -1) && <Button style={{marginLeft: '8px'}} type="primary" onClick={() => addEditor(dataset, 'reviewer')}>{`Make ${user?.username} reviewer`}</Button>}
           { (user?.editor?.indexOf(dataset.key) > -1) && <Button style={{marginLeft: '8px'}} type="danger" onClick={() => deleteEditor(dataset, 'editor')}>{`Remove ${user?.username} as editor`}</Button>}
           { (user?.reviewer?.indexOf(dataset.key) > -1) && <Button style={{marginLeft: '8px'}} type="danger" onClick={() => deleteEditor(dataset, 'reviewer')}>{`Remove ${user?.username} as reviewer`}</Button>}
          </Col>
        </Row>
        
      )}

      {userDatasets.length > 0 && <>
      <h3 style={{ marginTop: "10px" }}>{`Dataset scoped roles for ${user?.username}`}</h3>

      <Row>
        <Table 
          loading={loading}
          size="small"
         dataSource={userDatasets}
          columns={[
          {
            title: "Title",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
            render: (text, record) => {
              return (
                <Tooltip title={text}> <DatasetNavLink text={text} record={record} /></Tooltip>
              );
            },
            sorter: true,
          }, {
            title: "Roles",
            dataIndex: "",
            key: "roles",
            render: (text, record) => <Checkbox.Group
            options={[
              { label: "Editor", value: "editor" },
              { label: "Reviewer", value: "reviewer" },
            ]}
            value={['editor', 'reviewer'].filter(role => (user?.[role] || []).includes(record.key))}
            onChange={val => {
              const editor = (user?.editor || []).includes(record.key);
              const reviewer = (user?.reviewer || []).includes(record.key);
              if(val.includes('editor') && !editor){
                addEditor(record, 'editor')
              }
              if(val.includes('reviewer') && !reviewer){
                addEditor(record, 'reviewer')
              }
              if(!val.includes('editor') && editor){
                deleteEditor(record, 'editor')
              }
              if(!val.includes('reviewer') && reviewer){
                deleteEditor(record, 'reviewer')
              }
            }}
          />
            // sorter: true
          },]}
        />
      </Row>
      </>}

    </Popconfirm>
  );
};

const mapContextToProps = ({ addError }) => ({
  addError,
});

export default withContext(mapContextToProps)(UserRoles);
