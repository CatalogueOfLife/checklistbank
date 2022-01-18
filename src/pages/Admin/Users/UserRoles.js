import React, { useState, useEffect } from "react";
import { Checkbox, Popconfirm } from "antd";
import axios from "axios";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";

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
    </Popconfirm>
  );
};

const mapContextToProps = ({ addError }) => ({
  addError,
});

export default withContext(mapContextToProps)(UserRoles);
