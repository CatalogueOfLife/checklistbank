import React, { PureComponent } from 'react';
import injectSheet from 'react-jss';
import { Menu, Icon, Dropdown, Avatar, Modal, Button } from 'antd';

// Wrappers
import withContext from '../../hoc/withContext';
// Components
import LoginForm from './LoginForm';

const hashCode = function (str) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const styles = {
  avatar: {
    '& img': {
      imageRendering: 'crisp-edges',
      fallbacks: {
        imageRendering: 'pixelated'
      }
    }
  }
};

class UserMenu extends PureComponent {
  state = {
    visible: false,
    invalid: false
  };

  showLogin = () => {
    this.setState({
      visible: true
    });
  };

  handleLogin = (values) => {
    this.props.login(values)
      .then(() => {
        this.setState({
          visible: false,
          invalid: false
        });
      })
      .catch((err) => {
        this.setState({ invalid: err.message });
      });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
      invalid: false
    });
  };

  render() {
    const { classes, user, logout } = this.props;
    let currentUser;
    if (user) {
      const imgNr = Math.abs(hashCode(user.username)) % 10;
      currentUser = {
        name: user.username,
        avatar: `/_palettes/${imgNr}.png`
      };
    }

    const menu = (
      <Menu selectedKeys={[]}>
        {user && (
          <Menu.Item key="logout" onClick={() => {
            logout();
          }}>
            <Icon type="logout"/>
            Logout
          </Menu.Item>
        )}
      </Menu>
    );

    return (
      <React.Fragment>
        {!user && (
          <span style={{ padding: '0 16px' }}>
            <Button htmlType="button" type="primary" onClick={this.showLogin}>
              Login
            </Button>
          </span>
        )}
        {user && (
          <Dropdown overlay={menu} trigger={['hover', 'click']}>
          <span style={{ padding: '0 16px' }}>
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
          title="Login"
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

const mapContextToProps = ({ user, login, logout }) => ({ user, login, logout });

export default withContext(mapContextToProps)(injectSheet(styles)(UserMenu));