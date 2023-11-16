import React, { useState, useEffect } from "react";
import withContext from "../../components/hoc/withContext";
import { withRouter } from "react-router-dom";
import config from "../../config";
import _ from "lodash";
import { SettingOutlined } from "@ant-design/icons";
import { Modal, Select } from "antd";
import history from "../../history";
import { truncate } from "../../components/util";

// import DatasetAutocomplete from "../catalogue/Assembly/DatasetAutocomplete";

import axios from "axios";
const { Option } = Select;
/* 
function truncate(str, n){
  return (str?.length > n) ? str.substr(0, n-1) + '...' : str;
}; */

const SourceSeelect = ({
  catalogueKey,
  catalogue,
  setSourceDataset,
  sourceDataset,
  user,
  dataset,
  match,
  location,
  style = {},
}) => {
  const [sources, setSources] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSources();
  }, [catalogueKey]);

  useEffect(() => {
    if (match?.params?.sourceKey && sources?.length > 0) {
      const selectedSource = sources.find(
        (c) => c.key == match?.params?.sourceKey
      );
      setSourceDataset(selectedSource);
    }
  }, [match?.params?.sourceKey, sources]);

  const getSources = () => {
    setLoading(true);
    axios(
      `${config.dataApi}dataset?contributesTo=${catalogueKey}&limit=1000`
    ).then((res) => {
      setLoading(false);
      setSources(_.get(res, "data.result") ? _.get(res, "data.result") : []);
    });
  };
  const hide = () => {
    setVisible(false);
  };

  const handleVisibleChange = (visible) => {
    setVisible(visible);
  };

  const onSourceChange = (newDatasetKey) => {
    const {
      params: { sourceKey: key },
    } = match;

    const selectedSource = sources.find((c) => c.key === newDatasetKey);
    if (
      catalogueKey &&
      selectedSource &&
      _.get(location, "pathname").indexOf(
        `catalogue/${catalogueKey}/dataset/`
      ) > -1
    ) {
      const newPath = _.get(location, "pathname").replace(
        `catalogue/${catalogueKey}/dataset/${key}/`,
        `catalogue/${catalogueKey}/dataset/${newDatasetKey}/`
      );
      setSourceDataset(selectedSource);
      history.push({
        pathname: newPath,
      });
    } else if (catalogueKey) {
      setSourceDataset(selectedSource);
      history.push({
        pathname: `/catalogue/${catalogueKey}/dataset/${newDatasetKey}/issues`,
      });
    }
    setVisible(false);
  };

  return (
    <React.Fragment>
      <a
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          setVisible(true);
        }}
      >
        <SettingOutlined />
      </a>
      <Modal
        title="Select source"
        visible={visible}
        maskClosable={true}
        onCancel={hide}
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
            value={match?.params?.sourceKey}
            placeholder="Select source"
            optionFilterProp="children"
            onChange={onSourceChange}
            filterOption={(input, option) =>
              option.props.children
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            onDropdownVisibleChange={(open) => {
              if (open) {
                getSources();
              }
            }}
          >
            {sources.map((c) => (
              <Option
                onClick={(e) => {
                  e.domEvent.stopPropagation();
                  e.domEvent.nativeEvent.stopImmediatePropagation();
                }}
                value={c.key}
                key={c.key}
              >{`${c.alias ? c.alias : truncate(c.title, 50)} ${
                c.version || ""
              } [${c.key}]`}</Option>
            ))}
          </Select>
        </div>
      </Modal>
    </React.Fragment>
  );
};

const mapContextToProps = ({
  catalogueKey,
  catalogue,
  setSourceDataset,
  sourceDataset,
  user,
  dataset,
}) => ({
  catalogueKey,
  catalogue,
  setSourceDataset,
  sourceDataset,
  user,
  dataset,
});
export default withContext(mapContextToProps)(withRouter(SourceSeelect));
