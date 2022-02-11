import React, { PureComponent } from "react";
import injectSheet from "react-jss";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Menu, Dropdown, Avatar, Modal, Button, Divider } from "antd";
import { NavLink } from "react-router-dom";
import axios from "axios";
import config from "../../../config";

import CatalogueSelect from "../CatalogueSelect";
import Auth from "../../Auth";
// Wrappers
import withContext from "../../hoc/withContext";
// Components
import LoginForm from "./LoginForm";

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

const styles = {
  avatar: {
    "& img": {
      imageRendering: "crisp-edges",
      fallbacks: {
        imageRendering: "pixelated",
      },
    },
  },
};

class UserMenu extends PureComponent {
  state = {
    visible: false,
    invalid: false,
  };

  showLogin = () => {
    this.setState({
      visible: true,
    });
  };
  reset = () => {
    this.setState(
      {
        visible: false,
        invalid: false,
      },
      () => window.location.reload()
    );
  }

  handleLogin = (values) => {
    const {setCatalogue} = this.props;
    this.props
      .login(values)
      .then((user) => {
        if(!Auth.isAdmin(user) && user?.roles?.length && !localStorage.getItem("col_selected_project")){
          if(user?.editor?.length > 0){
            axios.get(`${config.dataApi}dataset/${user.editor[0]}`)
            .then(project => {
              setCatalogue(project?.data)
              this.reset()
            })
            .catch(err => {
              console.log(err)
            });
          } else if(!user.editor && user?.reviewer?.length > 0){
            axios.get(`${config.dataApi}dataset/${user.reviewer[0]}`)
            .then(project => {
              setCatalogue(project?.data)
              this.reset()
            })
            .catch(err => {
              console.log(err)
            });
          }
        } else {
          this.reset()
        }      
        
      })
      .catch((err) => {
        this.setState({ invalid: err.message });
      });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
      invalid: false,
    });
  };

  render() {
    const { classes, user, logout, catalogue } = this.props;
    let currentUser;
    if (user) {
      const imgNr = Math.abs(hashCode(user.username)) % 10;
      currentUser = {
        name: user.username,
        avatar: `/_palettes/${imgNr}.png`,
      };
    }

    const menu = (
      <Menu selectedKeys={[]}>
        <Menu.Item
          key="logout"
          onClick={() => {
            logout();
            window.location.reload();
          }}
        >
          <LogoutOutlined /> Logout
        </Menu.Item>
        <Menu.Item key="profile">
            <NavLink
                    to={{ pathname: `/user-profile` }}
                  >
                    <UserOutlined /> Profile
                  </NavLink>
              </Menu.Item>
        
        {Auth.isEditorOrAdmin(user) && (
          <Menu.ItemGroup title="Project">
            {(Auth.isAdmin(user) ||
              user?.editor?.length > 0 ||
              user?.reviewer?.length > 0) && (
              <Menu.Item key="project">
                <CatalogueSelect />
              </Menu.Item>
            )}
            <Menu.Item key="newproject">
            <NavLink
                    to={{ pathname: `/newdataset` }}
                  >
                    <span>Create new</span>
                  </NavLink>
              </Menu.Item>
          </Menu.ItemGroup>
        )}
      </Menu>
    );

    return (
      <React.Fragment>
        {!user && (
          <span style={{ padding: "0 16px" }}>
            <Button htmlType="button" type="primary" onClick={this.showLogin}>
              Login
            </Button>
          </span>
        )}
        {user && (
          <Dropdown overlay={menu} trigger={["click"]}>
            <span style={{ padding: "0 16px" }}>
              <Avatar
                style={{ marginRight: 8 }}
                size="small"
                className={classes.avatar}
                src={currentUser.avatar}
                alt="avatar"
              />
              <span>{currentUser.name}</span>
            </span>
          </Dropdown>
        )}
        <Modal
          title="Login with your GBIF account"
          visible={this.state.visible}
          onOk={this.handleLogin}
          onCancel={this.handleCancel}
          footer={null}
          destroyOnClose={true}
        >
          <div className={classes.background}>
            <LoginForm
              invalid={this.state.invalid}
              onLogin={this.handleLogin}
            />
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

const mapContextToProps = ({ user, login, logout, catalogue, setCatalogue }) => ({
  user,
  login,
  logout,
  catalogue,
  setCatalogue
});

export default withContext(mapContextToProps)(injectSheet(styles)(UserMenu));
