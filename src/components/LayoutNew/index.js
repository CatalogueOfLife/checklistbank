import React, { Component } from "react";
import injectSheet from "react-jss";
import withWidth, { LARGE, MEDIUM } from "react-width";
import { withRouter } from "react-router-dom";
import { Layout, Drawer, Row, Col, Tag, Alert, Tooltip } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LockOutlined,
} from "@ant-design/icons";
import BasicMenu from "./BasicMenu";
import UserMenu from "./UserMenu";
import { getGitVersion, getBackendGitVersion } from "../../api/gitVersion";
import "./menu.css";
import config from "../../config";
import moment from "moment";
import ErrorMsg from "../ErrorMsg";
import withContext from "../../components/hoc/withContext";
import _ from "lodash";
import DatasetLogo from "../../pages/DatasetList/DatasetLogo";
import Sync from "./Sync";
import Exception from "../exception/Exception";
import PulsatingDot from "./PulsatingDot";
import DatasetOriginPill from "./DatasetOriginPill";
import { truncate } from "../util";
// import withWidth, { MEDIUM } from "./hoc/Width";

const compose = _.flowRight;
const { gitBackend, gitFrontend } = config;
const titeMaxLength = 120;

const exceptionIsDataset404 = (error, location) => {
  return (
    _.get(error, "response.status") === 404 &&
    _.get(error, "response.request.responseURL") &&
    _.get(error, "response.request.responseURL").startsWith(
      `${config.dataApi}dataset/`
    ) &&
    location?.pathname.startsWith("/dataset")
  );
};
const styles = {
  sider: {
    overflow: "auto",
    height: "100vh",
    position: "fixed",
    left: 0,
  },
};

const { Header, Sider, Content, Footer } = Layout;
const menuWidth = 256;
const menuCollapsedWidth = 80;

class SiteLayout extends Component {
  constructor(props) {
    super(props);
    this.state = { false: true, gitVersion: null, gitBackendVersion: null };
  }

  componentDidMount = () => {
    getGitVersion().then((gitVersion) => this.setState({ gitVersion }));
    getBackendGitVersion().then((gitBackendVersion) =>
      this.setState({ gitBackendVersion })
    );
  };

  toggle = () => {
    const { width } = this.props;
    console.log(this.state.collapsed);
    const collapsed =
      typeof this.state.collapsed === "boolean"
        ? this.state.collapsed
        : width < LARGE;
    this.setState({
      collapsed: !collapsed,
    });
  };

  render() {
    const {
      width,
      classes,
      selectedDataset,
      selectedTaxon,
      selectedName,
      selectedSector,
      openKeys,
      selectedKeys,
      title,
      taxonOrNameKey,
      error,
      clearError,
      background,
      catalogue,
      match: {
        params: { catalogueKey },
      },
      location,
    } = this.props;
    // console.log("Status "+_.get(error, "response.status"))
    const collapsed =
      typeof this.state.collapsed === "boolean"
        ? this.state.collapsed
        : width < LARGE;
    const isMobile = width < MEDIUM;
    const { gitVersion, gitBackendVersion } = this.state;
    let contentMargin = collapsed ? menuCollapsedWidth : menuWidth;
    if (isMobile) {
      contentMargin = 0;
    }

    const sideMenu = (
      <React.Fragment>
        {!isMobile && (
          <Sider
            className={classes.sider}
            width={menuWidth}
            trigger={null}
            reverseArrow={true}
            collapsible
            collapsedWidth={menuCollapsedWidth}
            breakpoint="lg"
            onBreakpoint={(broken) => {
              console.log(broken);
            }}
            onCollapse={(collapsed, type) => {
              console.log(collapsed, type);
            }}
            collapsed={collapsed}
          >
            <BasicMenu
              collapsed={collapsed}
              selectedDataset={selectedDataset}
              selectedTaxon={selectedTaxon}
              selectedName={selectedName}
              taxonOrNameKey={taxonOrNameKey}
              openKeys={openKeys}
              selectedKeys={selectedKeys}
              selectedSector={selectedSector}
            />
          </Sider>
        )}

        {isMobile && (
          <Drawer
            placement="left"
            width={menuWidth}
            closable={false}
            onClose={() => {
              this.setState({ collapsed: true });
            }}
            visible={!collapsed}
            className="mainMenu__drawer"
          >
            <BasicMenu />
          </Drawer>
        )}
      </React.Fragment>
    );

    return (
      <Layout style={{ minHeight: "100vh" }}>
        {sideMenu}
        <Layout style={{ marginLeft: contentMargin + "px" }}>
          <Header
            style={
              config.env === "dev"
                ? {
                    backgroundImage: `url("/images/test-env.svg")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "45%",
                    backgroundColor: "#fff",
                    display: "flex",
                  }
                : { background: "#fff", display: "flex" }
            }
          >
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{
                  flex: "0 0 auto",
                  marginTop: "20px",
                  marginLeft: "-58px",
                }}
                className="menu-trigger"
                onClick={this.toggle}
              />
            ) : (
              <MenuFoldOutlined
                style={{
                  flex: "0 0 auto",
                  marginTop: "20px",
                  marginLeft: "-58px",
                }}
                className="menu-trigger"
                onClick={this.toggle}
              />
            )}
            <div style={{ flex: "1 1 auto", textAlign: "center" }}>
              {selectedDataset && (
                <React.Fragment>
                  <Row>
                    <Col flex="auto"></Col>
                    <Col>
                      <DatasetLogo
                        datasetKey={selectedDataset.key}
                        style={{ height: "50px", marginRight: "10px" }}
                      />
                    </Col>
                    <Col>
                      <h1 style={{ display: "inline" }}>
                        {selectedDataset?.title?.length < titeMaxLength ? (
                          selectedDataset?.title
                        ) : (
                          <Tooltip title={selectedDataset?.title}>
                            {truncate(selectedDataset?.title, titeMaxLength)}
                          </Tooltip>
                        )}
                        {selectedDataset.private && (
                          <React.Fragment>
                            {" "}
                            <Tooltip
                              placement="bottom"
                              title={"This dataset is private"}
                            >
                              <LockOutlined style={{ color: "red" }} />
                            </Tooltip>
                          </React.Fragment>
                        )}
                      </h1>
                      {catalogue &&
                        selectedDataset &&
                        catalogue?.key !== selectedDataset?.key && (
                          <h5
                            style={{ marginTop: "-48px" }}
                          >{`in ${catalogue.title}`}</h5>
                        )}
                    </Col>
                    <Col>
                      <span style={{ marginRight: "8px", marginLeft: "8px" }}>
                        {" "}
                        {selectedDataset.version || selectedDataset.issued}
                      </span>
                      <DatasetOriginPill dataset={selectedDataset} />
                    </Col>
                    <Col flex="auto"></Col>
                  </Row>
                </React.Fragment>
              )}

              {!selectedDataset && catalogue && title && (
                <>
                  <h1 style={{ display: "inline" }}>{title}</h1>{" "}
                  {catalogueKey && (
                    <DatasetOriginPill
                      dataset={{ key: catalogueKey, origin: catalogue?.origin }}
                    />
                  )}
                </>
              )}
            </div>
            <div className="header__secondary" style={{ flex: "0 0 auto" }}>
              <UserMenu />
              <Sync />
            </div>
          </Header>

          <Content
            style={{
              overflow: "initial",
              margin: isMobile ? "0 0px 24px 0px" : "0 16px 24px 16px",
              minHeight: 280,
            }}
          >
            {background && background.maintenance && (
              <Alert
                style={{ marginTop: "10px" }}
                message={
                  <Row align="middle">
                    <Col>
                      <PulsatingDot />
                    </Col>
                    <Col style={{ paddingLeft: "10px" }}>
                      The system is under maintenance - please expect errors.
                    </Col>
                  </Row>
                }
                type="warning"
              />
            )}
            {error &&
              ![401, 403].includes(_.get(error, "response.status")) &&
              !exceptionIsDataset404(error, location) &&
              ([431, 413].includes(_.get(error, "response.status")) ||
                error?.message !== "Network Error") && (
                <Alert
                  style={{ marginTop: "10px" }}
                  description={<ErrorMsg error={error} />}
                  type="error"
                  closable
                  onClose={clearError}
                />
              )}
            {error && error?.message === "Network Error" && (
              <Alert
                style={{ marginTop: "10px" }}
                description={
                  "The network connection was interupted. Check your internet connection and reload the page."
                }
                type="warning"
                showIcon
                closable
                onClose={clearError}
              />
            )}
            {(error && [401, 403].includes(_.get(error, "response.status"))) ||
            exceptionIsDataset404(error, location) ? (
              <Exception
                type={_.get(error, "response.status").toString()}
                desc={
                  exceptionIsDataset404(error, location)
                    ? _.get(error, "response.data.message")
                    : null
                }
              />
            ) : (
              this.props.children
            )}
          </Content>
          <Footer>
            <Row>
              <Col>
                <Row style={{ textAlign: "center" }}>
                  Developed by GBIF & Catalogue of Life
                </Row>
                <Row style={{ textAlign: "center", marginTop: "8px" }}>
                  <Tag>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://github.com/CatalogueOfLife/checklistbank/issues/new"
                    >
                      Leave Feedback
                    </a>
                  </Tag>
                  {gitVersion && (
                    <Tag>
                      <a
                        target="_blank"
                        href={`${gitFrontend}${gitVersion.short}`}
                      >
                        Frontend version: <strong>{gitVersion.short}</strong>{" "}
                        {moment(gitVersion.created).format("LLL")}
                      </a>
                    </Tag>
                  )}
                  {gitBackendVersion && (
                    <Tag>
                      <a
                        target="_blank"
                        href={`${gitBackend}${gitBackendVersion.short}`}
                      >
                        Backend version:{" "}
                        <strong>{gitBackendVersion.short}</strong>{" "}
                        {moment(gitBackendVersion.created).format("LLL")}
                      </a>
                    </Tag>
                  )}
                </Row>
              </Col>
              <Col flex="auto"></Col>
              <Col>
                <Row>
                  <img src="/images/GCBR-Logo-RGB.svg" height={48} />
                </Row>
              </Col>
            </Row>
          </Footer>
        </Layout>
      </Layout>
    );
  }
}

const mapContextToProps = ({
  addError,
  clearError,
  error,
  background,
  catalogue,
}) => ({
  addError,
  clearError,
  error,
  background,
  catalogue,
});

export default compose(
  injectSheet(styles),
  withWidth(),
  withContext(mapContextToProps),
  withRouter
)(SiteLayout);

//export default injectSheet(styles)(withWidth()(SiteLayout));
