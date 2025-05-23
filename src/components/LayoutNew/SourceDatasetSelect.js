import React, { useState, useEffect } from "react";
import withContext from "../../components/hoc/withContext";
import { withRouter } from "react-router-dom";
import config from "../../config";
import _ from "lodash";
import { SettingOutlined } from "@ant-design/icons";
import { Modal, Select, Checkbox } from "antd";
import history from "../../history";
import { truncate } from "../../components/util";

import DatasetAutocomplete from "../../pages/catalogue/Assembly/DatasetAutocomplete";

import axios from "axios";
const { Option } = Select;
/* 
function truncate(str, n){
  return (str?.length > n) ? str.substr(0, n-1) + '...' : str;
}; */

const SourceSelect = ({
  catalogueKey,
  setSourceDataset,

  match,
  location,
  style = {},
}) => {
  const [visible, setVisible] = useState(false);
  const [merge, setMerge] = useState(false);

  useEffect(() => {
    // getSources();
  }, [catalogueKey]);

  useEffect(() => {
    if (match?.params?.sourceKey) {
      getSourceDataset(match?.params?.sourceKey);
    }
  }, [match?.params?.sourceKey]);

  const getSourceDataset = async (key) => {
    try {
      const res = await axios(
        `${config.dataApi}dataset/${catalogueKey}/source/${key}`
      );

      setSourceDataset(res?.data);
    } catch (error) {
      console.log(error);
    }
  };

  const hide = () => {
    setVisible(false);
  };

  const onSourceChange = (selectedSource) => {
    const {
      params: { sourceKey: key },
    } = match;
    if (
      catalogueKey &&
      selectedSource &&
      _.get(location, "pathname").indexOf(
        `catalogue/${catalogueKey}/dataset/`
      ) > -1
    ) {
      const newPath = _.get(location, "pathname").replace(
        `catalogue/${catalogueKey}/dataset/${key}/`,
        `catalogue/${catalogueKey}/dataset/${selectedSource.key}/`
      );
      setSourceDataset(selectedSource?.data);
      history.push({
        pathname: newPath,
      });
    } else if (catalogueKey) {
      setSourceDataset(selectedSource?.data);
      history.push({
        pathname: `/catalogue/${catalogueKey}/dataset/${selectedSource.key}/issues`,
      });
    }
    //  setVisible(false);
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
          <DatasetAutocomplete
            contributesTo={catalogueKey}
            onSelectDataset={onSourceChange}
            defaultDatasetKey={match?.params?.sourceKey}
            merge={merge}
          />
          <Checkbox onChange={(e) => setMerge(e.target.checked)}>
            Include merged sources
          </Checkbox>
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
export default withContext(mapContextToProps)(withRouter(SourceSelect));
