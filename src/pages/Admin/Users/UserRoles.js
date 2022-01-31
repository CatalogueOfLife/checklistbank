import React, { useState, useEffect } from "react";
import { Checkbox, Popconfirm, Row, Col, Button, Tag , Typography,  notification} from "antd";
import axios from "axios";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import DatasetAutocomplete from "../../catalogue/Assembly/DatasetAutocomplete";
const { Text } = Typography;


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
  useEffect(() => {
    setOptions([
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
    ]);
    setRoles(user?.roles || []);
  }, [user]);

  const updateRoles = async (roles) => {
    setConfirmVisible(false);
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

  const onChange = (checkedValues) => {
    setNewRoles(checkedValues);
    if (checkedValues.indexOf("editor") === -1 && user?.editor?.length) {
      setConfirmText(`Remove editor of ${user?.editor?.length} datasets?`);
      setConfirmVisible(true);
    } else if (
      checkedValues.indexOf("reviewer") === -1 &&
      user?.reviewer?.length
    ) {
      setConfirmText(`Remove reviewer of ${user?.reviewer?.length} datasets?`);
      setConfirmVisible(true);
    } else {
      updateRoles(checkedValues);
    }
  };

  const confirm = () => {
    updateRoles(newRoles);
  };

  const addEditor = async () => {
      try {
        await axios.post(
          `${config.dataApi}dataset/${dataset?.key}/editor`,
          user?.key,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        notification.success({
          message: `Added editor`,
          description: user?.username,
        });
        if (typeof onChangeCallback === "function") {
          onChangeCallback();
        }
      } catch (err) {
        addError(err);
      }
    
  };

  const deleteEditor = async () => {
    try {
      await axios.delete(
        `${config.dataApi}dataset/${dataset?.key}/editor/${user.key}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      notification.success({
        message: `Removed editor`,
        description: user?.username,
      });
      if (typeof onChangeCallback === "function") {
        onChangeCallback();
      }
    } catch (err) {
      addError(err);
    }
  };

  return (
    <Popconfirm
      title={confirmText}
      visible={confirmVisible}
      // onVisibleChange={handleVisibleChange}
      onConfirm={confirm}
      onCancel={() => setConfirmVisible(false)}
    >
      <Checkbox.Group
        options={options}
        value={roles}
        visible={confirmVisible}
        onChange={onChange}
      />

      <h3 style={{ marginTop: "10px" }}>{`Select a dataset to make ${user?.username} editor`}</h3>
      <Row style={{ marginTop: "10px" }}>
        <DatasetAutocomplete
          onSelectDataset={setDataset}
          onResetSearch={() => setDataset(null)}
        />
      </Row>
      {dataset && (
        <>
{/*         <Row style={{ marginTop: "10px" }}>
          <Col >
            <Tag
              title={dataset?.title}
              closable
              onClose={() => setDataset(null)}
            >
              {
                <Text
                style={{ width: 438 }}
                ellipsis={{ tooltip: dataset?.title }}
                >
                  {dataset?.title}
                </Text>
              }
            </Tag>{" "}
          </Col>
          
        </Row>  */}
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto"></Col>
          <Col>
           { (!user.editor || user?.editor?.indexOf(dataset.key) === -1) && <Button type="primary" onClick={addEditor}>{`Make ${user?.username} editor`}</Button>}
           { (user?.editor?.indexOf(dataset.key) > -1) && <Button type="danger" onClick={deleteEditor}>{`Remove ${user?.username} as editor`}</Button>}
          </Col>
        </Row>
        </>
      )}
    </Popconfirm>
  );
};

const mapContextToProps = ({ addError }) => ({
  addError,
});

export default withContext(mapContextToProps)(UserRoles);
