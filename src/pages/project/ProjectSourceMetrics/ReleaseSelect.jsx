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
      getReleases();
    }
  }, [projectKey]);

  // The ?releaseKey= default is applied on its own, not chained onto the
  // release list: setDefaultValue resolves the key directly and projectKey is
  // derived from the context dataset, which starts out as a stub without
  // sourceKey - so on a release page projectKey is still undefined at mount and
  // only arrives a render later.
  useEffect(() => {
    if (
      defaultReleaseKey &&
      Number(selectedRelease?.value) !== Number(defaultReleaseKey)
    ) {
      setDefaultValue(defaultReleaseKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultReleaseKey]);

  // allowClear hands us undefined; onReleaseChange drops the comparison then.
  const handleReleaseChange = (release) => {
    onReleaseChange(release?.value, release?.label);
    setSelectedRelease(release || null);
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
