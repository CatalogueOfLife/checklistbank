import React, { PureComponent } from 'react';
import injectSheet from 'react-jss';
import { GlobalOutlined } from '@ant-design/icons';
import { Menu, Dropdown } from 'antd';

const styles = {

};

class SelectLang extends PureComponent {
  render() {
    const { classes, changeLocale, locale } = this.props;
    const langMenu = (
      <Menu onClick={(e) => {}} >
        <Menu.Item key="en">
          <span role="img" aria-label="English">
            🇬🇧
          </span>{' '}
          English
        </Menu.Item>
        <Menu.Item key="da-DK">
          <span role="img" aria-label="Português">
            🇵🇹
          </span>{' '}
          Dansk
        </Menu.Item>
      </Menu>
    );
    return (
      <Dropdown overlay={langMenu} placement="bottomRight">
        <GlobalOutlined title="title" />
      </Dropdown>
    );
  }
}


export default injectSheet(styles)(SelectLang);