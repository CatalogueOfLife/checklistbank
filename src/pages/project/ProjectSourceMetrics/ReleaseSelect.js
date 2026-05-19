import React from "react";
import config from "../../../config";
import _ from "lodash";
import { Select } from "antd";
// import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";

import axios from "axios";

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
    if (this.props?.projectKey) {
      this.getReleases().then(() => {
        const { defaultReleaseKey } = this.props;
        if (defaultReleaseKey) {
          // this.setState({ selectedRelease: defaultReleaseKey });
          this.setDefaultValue(defaultReleaseKey);
        }
      });
    }
  };

  setDefaultValue = (defaultReleaseKey) => {
    const { onReleaseChange } = this.props;
    axios(`${config.dataApi}dataset/${defaultReleaseKey}`).then((res) => {
      const releaseLabel = `${res?.data?.alias || res?.data?.key} [${
        res?.data?.version
      }]`;
      onReleaseChange(defaultReleaseKey, releaseLabel);
      this.setState({
        selectedRelease: { value: res?.data?.key, label: releaseLabel },
      });
    });
  };

  componentDidUpdate = (prevProps) => {
    if (
      _.get(prevProps, "projectKey") !== _.get(this.props, "projectKey")
    ) {
      this.getReleases();
    }
  };
  getReleases = () => {
    const { projectKey } = this.props;
    this.setState({ loading: true });
    return axios(
      `${config.dataApi}dataset?releasedFrom=${projectKey}&limit=1000`
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
        optionFilterProp="label"
        onChange={this.onReleaseChange}
        filterOption={(input, option) =>
          option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        options={releases
          .filter((c) => !omitList.includes(c.key))
          .map((c) => ({
            value: c.key,
            label: `${c.alias ? c.alias : c.key} [${c.version}]`,
          }))}
      />
    );
  };
}

export default RealeaseSelect;
