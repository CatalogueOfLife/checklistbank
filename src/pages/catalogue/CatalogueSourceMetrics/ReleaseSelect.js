import React from "react";
import config from "../../../config";
import _ from "lodash";
import { Select } from "antd";
// import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";

import axios from "axios";
const { Option } = Select;

class RealeaseSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      releases: [],
      selectedRelease: null,
      loading: false,
    };
  }

  componentDidMount = () => {
    this.getReleases().then(() => {
      const { defaultReleaseKey } = this.props;
    if (defaultReleaseKey) {
      // this.setState({ selectedRelease: defaultReleaseKey });
      this.setDefaultValue(defaultReleaseKey)
    }
    });
    
  };

  setDefaultValue = (defaultReleaseKey) => {
    const {onReleaseChange} = this.props;
    axios(`${config.dataApi}dataset/${defaultReleaseKey}`).then((res) => {
      const releaseLabel = `${res?.data?.alias || res?.data?.key} [${res?.data?.version}]`;
      onReleaseChange(defaultReleaseKey, releaseLabel);
      this.setState({ selectedRelease: { value:res?.data?.key, label:releaseLabel}});
    });
  };

  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "catalogueKey") !== _.get(this.props, "catalogueKey")
    ) {
      this.getReleases();
    }
  };
  getReleases = () => {
    const { catalogueKey } = this.props;
    this.setState({ loading: true });
   return axios(
      `${config.dataApi}dataset?releasedFrom=${catalogueKey}&limit=1000`
    ).then((res) =>
      this.setState({
        releases: _.get(res, "data.result") ? _.get(res, "data.result") : [],
        loading: false,
      })
    );
  };

  handleVisibleChange = (visible) => {
    this.setState({ visible });
  };

  onReleaseChange = (release) => {
    const releaseKey = release.value;
    const { onReleaseChange } = this.props;
    onReleaseChange(releaseKey, release.label);
    this.setState({ selectedRelease: release });
  };
  render = () => {
    const { releases, selectedRelease, loading } = this.state;
    const omitList = this.props.omitList || [];
    return (
      <Select
        showSearch
        labelInValue
        allowClear
        loading={loading}
        style={{ width: "100%" }}
        value={selectedRelease}
        placeholder="Select release"
        optionFilterProp="children"
        onChange={this.onReleaseChange}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        {releases
          .filter((c) => !omitList.includes(c.key))
          .map((c) => (
            <Option value={c.key} key={c.key}>{`${
              c.alias ? c.alias : c.key
            } [${c.version}]`}</Option>
          ))}
      </Select>
    );
  };
}

export default RealeaseSelect;
