import React from "react";
import withContext from "../../components/hoc/withContext";
import { withRouter } from "react-router-dom";
import config from "../../config";
import _ from "lodash";
import { SearchOutlined } from "@ant-design/icons";
import { Modal, Select } from "antd";
import history from "../../history";
// import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";

import axios from "axios";
const { Option } = Select;

class CatalogueSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      catalogues: [],
      visible: false,
      loading: false,
    };
  }

  componentDidMount = () => {
    this.getCatalogues();
  };

  getCatalogues = () => {
    const { user } = this.props;
    const { roles } = user;
    roles.includes("admin") || roles.includes("editor");
    this.setState({ loading: true });
    axios(
      `${config.dataApi}dataset?origin=managed&limit=1000${
        roles.includes("admin") ? "" : "&editor=" + user.key
      }`
    ).then((res) =>
      this.setState({
        catalogues: _.get(res, "data.result") ? _.get(res, "data.result") : [],
        loading: false,
      })
    );
  };
  hide = () => {
    this.setState({
      visible: false,
    });
  };

  handleVisibleChange = (visible) => {
    this.setState({ visible });
  };

  onCatalogueChange = (newCatalogueKey) => {
    const { setCatalogue } = this.props;
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    const { catalogues } = this.state;
    if (catalogueKey) {
      const newPath = _.get(this.props, "location.pathname").replace(
        `catalogue/${catalogueKey}/`,
        `catalogue/${newCatalogueKey}/`
      );
      history.push({
        pathname: newPath,
      });
    } else {
      const selectedCatalogue = catalogues.find(
        (c) => c.key === newCatalogueKey
      );

      setCatalogue(selectedCatalogue);
    }

    this.setState({ visible: false });
  };
  render = () => {
    const {
      match: {
        params: { catalogueKey },
      },
    } = this.props;
    const { catalogues, loading } = this.state;
    return (
      <React.Fragment>
        <a
          onClick={(e) => {
            e.stopPropagation();
            this.setState({ visible: true });
          }}
        >
          <SearchOutlined />
        </a>
        <Modal
          title="Select catalogue"
          visible={this.state.visible}
          maskClosable={true}
          onCancel={this.hide}
          footer={null}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
          >
            <Select
              showSearch
              loading={loading}
              style={{ width: "100%" }}
              value={catalogueKey || null}
              placeholder="Select catalogue"
              optionFilterProp="children"
              onChange={this.onCatalogueChange}
              filterOption={(input, option) =>
                option.props.children
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
              onDropdownVisibleChange={(open) => {
                if (open) {
                  this.getCatalogues();
                }
              }}
            >
              {catalogues.map((c) => (
                <Option
                  onClick={(e) => {
                    e.domEvent.stopPropagation();
                    e.domEvent.nativeEvent.stopImmediatePropagation();
                  }}
                  value={c.key}
                  key={c.key}
                >{`${c.alias ? c.alias + " " : ""}[${c.key}]`}</Option>
              ))}
            </Select>
          </div>
        </Modal>
      </React.Fragment>
    );
  };
}
const mapContextToProps = ({
  catalogueKey,
  catalogue,
  setCatalogue,
  user,
}) => ({
  catalogueKey,
  catalogue,
  setCatalogue,
  user,
});
export default withContext(mapContextToProps)(withRouter(CatalogueSelect));
