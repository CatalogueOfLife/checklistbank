import { useState } from "react";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Menu, Dropdown, Avatar, Modal, Button, Divider } from "antd";
import { NavLink } from "react-router-dom";
import axios from "axios";
import config from "../../../config";

import ProjectSelect from "../ProjectSelect";
import Auth from "../../Auth";
// Wrappers
import withContext from "../../hoc/withContext";
// Components
import LoginForm from "./LoginForm";
import styles from "./UserMenu.module.css";

const hashCode = function (str) {
  let hash = 0,
    i,
    chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const UserMenu = ({ user, login, logout, project, setProject }) => {
  const [visible, setVisible] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const showLogin = () => {
    setVisible(true);
  };

  const reset = () => {
    setVisible(false);
    setInvalid(false);
    window.location.reload();
  };

  const handleLogin = (values) => {
    login(values)
      .then((user) => {
        if (!Auth.isAdmin(user) && user?.roles?.length && !localStorage.getItem("col_selected_project")) {
          if (user?.editor?.length > 0) {
            axios.get(`${config.dataApi}dataset/${user.editor[0]}`)
              .then(project => {
                setProject(project?.data);
                reset();
              })
              .catch(err => {
                console.log(err);
              });
          } else if (!user.editor && user?.reviewer?.length > 0) {
            axios.get(`${config.dataApi}dataset/${user.reviewer[0]}`)
              .then(project => {
                setProject(project?.data);
                reset();
              })
              .catch(err => {
                console.log(err);
              });
          }
        } else {
          reset();
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setInvalid(`Invalid Username or password`);
        } else {
          setInvalid(err.message);
        }
      });
  };

  const handleCancel = () => {
    setVisible(false);
    setInvalid(false);
  };

  let currentUser;
  if (user) {
    const imgNr = Math.abs(hashCode(user.username)) % 10;
    currentUser = {
      name: user.username,
      avatar: `/_palettes/${imgNr}.png`,
    };
  }

  const menu = (
    <Menu
      selectedKeys={[]}
      items={[
        {
          key: "logout",
          label: (
            <>
              <LogoutOutlined /> Logout
            </>
          ),
          onClick: () => {
            logout();
            window.location.reload();
          },
        },
        {
          key: "profile",
          label: (
            <NavLink to={{ pathname: `/user-profile` }}>
              <UserOutlined /> Profile
            </NavLink>
          ),
        },
      ]}
    />
  );

  return (
    <>
      {!user && (
        <span style={{ padding: "0 16px" }}>
          <Button htmlType="button" type="primary" onClick={showLogin}>
            Login
          </Button>
        </span>
      )}
      {user && (
        <Dropdown popupRender={() => menu} trigger={["click"]}>
          <span style={{ padding: "0 16px" }}>
            <Avatar
              style={{ marginRight: 8 }}
              size="small"
              className={styles.avatar}
              src={currentUser.avatar}
              alt="avatar"
            />
            <span>{currentUser.name}</span>
          </span>
        </Dropdown>
      )}
      <Modal
        title="Login with your GBIF account"
        open={visible}
        onOk={handleLogin}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden={true}
      >
        <div className={styles.background}>
          <LoginForm
            invalid={invalid}
            onLogin={handleLogin}
          />
        </div>
      </Modal>
    </>
  );
};

const mapContextToProps = ({ user, login, logout, project, setProject }) => ({
  user,
  login,
  logout,
  project,
  setProject
});

export default withContext(mapContextToProps)(UserMenu);
