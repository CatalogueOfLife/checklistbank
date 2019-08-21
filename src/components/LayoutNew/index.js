
import React, { Component } from 'react';
import injectSheet from 'react-jss';
import withWidth, { MEDIUM, EXTRA_LARGE } from 'react-width'
import { Layout, Icon, Drawer, Row, Tag } from 'antd';
import BasicMenu from './BasicMenu'
import SelectLang from './SelectLang'
import UserMenu from './UserMenu'
import Logo from './Logo'
import { getGitVersion, getBackendGitVersion } from '../../api/gitVersion'
import './menu.css';
import config from "../../config";
import moment from "moment";

const { gitBackend, gitFrontend} = config;
// Currently no support for rtl in Ant https://github.com/ant-design/ant-design/issues/4051
const styles = {
  sider: {
    overflow: 'auto',
    height: '100vh',
    position: 'fixed',
    left: 0
  }
};

const { Header, Sider, Content, Footer } = Layout;
const menuWidth = 256;
const menuCollapsedWidth = 80;

class SiteLayout extends Component {
  constructor(props) {
    super(props)
    this.state = { false: true, gitVersion: null , gitBackendVersion: null};
  }

  componentDidMount = () => {
    getGitVersion().then(gitVersion => this.setState({gitVersion}))
    getBackendGitVersion().then(gitBackendVersion => this.setState({gitBackendVersion}))
  }
  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }

  render() {
    const { width, classes, selectedDataset, selectedTaxon, selectedName, selectedSector, openKeys, selectedKeys, title , taxonOrNameKey} = this.props;
    const collapsed = typeof this.state.collapsed === 'boolean'
      ? this.state.collapsed
      : width < EXTRA_LARGE;
    const isMobile = width < MEDIUM;
    const {gitVersion, gitBackendVersion} = this.state;
    let contentMargin = collapsed ? menuCollapsedWidth : menuWidth;
    if (isMobile) {
      contentMargin = 0;
    }

    const sideMenu = <React.Fragment>
      {!isMobile && <Sider
        className={classes.sider}
        width={menuWidth}
        trigger={null}
        reverseArrow={true}
        collapsible
        collapsedWidth={menuCollapsedWidth}
        breakpoint="lg"
        onBreakpoint={(broken) => { console.log(broken); }}
        onCollapse={(collapsed, type) => { console.log(collapsed, type); }}
        collapsed={collapsed}
      >
        <BasicMenu collapsed={collapsed} selectedDataset={selectedDataset} selectedTaxon={selectedTaxon} selectedName={selectedName} taxonOrNameKey={taxonOrNameKey} openKeys={openKeys} selectedKeys={selectedKeys} selectedSector={selectedSector}/>
      </Sider>
      }

      {isMobile && <Drawer
        placement="left"
        closable={false}
        onClose={() => { this.setState({ collapsed: true }) }}
        visible={!collapsed}
        className="mainMenu__drawer"
      >
        <BasicMenu />
      </Drawer>
      }
    </React.Fragment>;

    return (
      <Layout style={{ minHeight: '100vh' }}>
        {sideMenu}
        <Layout style={{ marginLeft: contentMargin + 'px' }}>

          <Header style={{ background: '#fff',  display: 'flex' }}>
            <Icon
              style={{ flex: '0 0 auto' , marginTop: '20px', marginLeft: '-58px'}}
              className="menu-trigger"
              type={collapsed ? 'menu-unfold' : 'menu-fold'}
              onClick={this.toggle}
            />
            <div style={{ flex: '1 1 auto', textAlign: 'center' }}>
            {selectedDataset && <h1>{selectedDataset.title}</h1>}
            {!selectedDataset && title && <h1>{title}</h1>}
            </div>
            <div className="header__secondary" style={{ flex: '0 0 auto' }}>
              <UserMenu />
    { /* <SelectLang /> */}
            </div>
          </Header>


          <Content style={{ overflow: 'initial', margin: '0 16px 24px 16px', minHeight: 280 }}>
            {this.props.children}
          </Content>
          <Footer >
            <Row style={{ textAlign: 'center' }}>Catalogue of Life+</Row>
            <Row style={{ textAlign: 'center', marginTop: '8px' }}>
            {gitVersion && <Tag>
      <a href={`${gitFrontend}${gitVersion.short}`}>Frontend version: <strong>{gitVersion.short}</strong> {moment(gitVersion.created).format('LLL')}</a>
    </Tag>}
            {gitBackendVersion && <Tag>
      <a href={`${gitBackend}${gitBackendVersion.short}`}>Backend version: <strong>{gitBackendVersion.short}</strong> {moment(gitBackendVersion.created).format('LLL')}</a>
    </Tag>}

            </Row>
            
            
          </Footer>
        </Layout>
      </Layout>
    );
  }
}


// let HOC = props => (
//   <StateContext.Consumer>
//     {({ locale }) => {
//       return <SiteLayout {...props} local={locale} />;
//     }}
//   </StateContext.Consumer>
// );

// redux here

export default injectSheet(styles)(withWidth()(SiteLayout));