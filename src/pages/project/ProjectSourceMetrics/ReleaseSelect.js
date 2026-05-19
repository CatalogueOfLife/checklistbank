import { useState, useEffect } from "react";
import config from "../../../config";
import _ from "lodash";
import { Select } from "antd";

import axios from "axios";

const RealeaseSelect = ({ projectKey, defaultReleaseKey, onReleaseChange, omitList }) => {
  const [releases, setReleases] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [loading, setLoading] = useState(false);

  const getReleases = () => {
    setLoading(true);
    return axios(
      `${config.dataApi}dataset?releasedFrom=${projectKey}&limit=1000`
    ).then((res) => {
      setReleases(_.get(res, "data.result") ? _.get(res, "data.result") : []);
      setLoading(false);
    });
  };

  const setDefaultValue = (key) => {
    axios(`${config.dataApi}dataset/${key}`).then((res) => {
      const releaseLabel = `${res?.data?.alias || res?.data?.key} [${
        res?.data?.version
      }]`;
      onReleaseChange(key, releaseLabel);
      setSelectedRelease({ value: res?.data?.key, label: releaseLabel });
    });
  };

  useEffect(() => {
    if (projectKey) {
      getReleases().then(() => {
        if (defaultReleaseKey) {
          setDefaultValue(defaultReleaseKey);
        }
      });
    }
  }, []);

  useEffect(() => {
    getReleases();
  }, [projectKey]);

  const handleReleaseChange = (release) => {
    const releaseKey = release.value;
    onReleaseChange(releaseKey, release.label);
    setSelectedRelease(release);
  };

  const omit = omitList || [];

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
      onChange={handleReleaseChange}
      filterOption={(input, option) =>
        option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
      options={releases
        .filter((c) => !omit.includes(c.key))
        .map((c) => ({
          value: c.key,
          label: `${c.alias ? c.alias : c.key} [${c.version}]`,
        }))}
    />
  );
};

export default RealeaseSelect;
