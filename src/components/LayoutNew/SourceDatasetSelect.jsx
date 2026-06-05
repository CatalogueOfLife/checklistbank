import React, { useState, useEffect } from "react";
import withContext from "../../components/hoc/withContext";
import withRouter from "../../withRouter";
import config from "../../config";
import _ from "lodash";
import { SettingOutlined } from "@ant-design/icons";
import { Modal, Select, Checkbox } from "antd";
import history from "../../history";
import { truncate } from "../../components/util";

import DatasetAutocomplete from "../../pages/project/Assembly/DatasetAutocomplete";

import axios from "axios";
/*
function truncate(str, n){
  return (str?.length > n) ? str.substr(0, n-1) + '...' : str;
}; */

const SourceSelect = ({
  projectKey,
  setSourceDataset,

  match,
  location,
  style = {},
}) => {
  const [visible, setVisible] = useState(false);
  const [merge, setMerge] = useState(false);

  useEffect(() => {
    // getSources();
  }, [projectKey]);

  useEffect(() => {
    if (match?.params?.sourceKey) {
      getSourceDataset(match?.params?.sourceKey);
    }
  }, [match?.params?.sourceKey]);

  const getSourceDataset = async (key) => {
    try {
      const res = await axios(
        `${config.dataApi}dataset/${projectKey}/source/${key}`
      );

      setSourceDataset(res?.data);
    } catch (error) {
      // New sources may not resolve through the project-scoped endpoint yet -
      // fall back to the plain dataset so the source menu still renders.
      try {
        const res = await axios(`${config.dataApi}dataset/${key}`);
        setSourceDataset(res?.data);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const hide = () => {
    setVisible(false);
  };

  const onSourceChange = (selectedSource) => {
    const {
      params: { sourceKey: key },
    } = match;
    // DatasetAutocomplete echoes its default value back as a raw dataset
    // (no .data wrapper) whenever it mounts or the URL changes. Ignore those
    // echoes - getSourceDataset already maintains the context - so they can
    // never clear sourceDataset and blank the source menu (#1670).
    if (!selectedSource || String(selectedSource.key) === String(key)) {
      return;
    }
    // user selections from the autocomplete arrive as { key, title, data }
    const source = selectedSource.data ?? selectedSource;
    if (
      projectKey &&
      _.get(location, "pathname").indexOf(
        `project/${projectKey}/dataset/`
      ) > -1
    ) {
      const newPath = _.get(location, "pathname").replace(
        `project/${projectKey}/dataset/${key}/`,
        `project/${projectKey}/dataset/${selectedSource.key}/`
      );
      setSourceDataset(source);
      history.push({
        pathname: newPath,
      });
    } else if (projectKey) {
      setSourceDataset(source);
      history.push({
        pathname: `/project/${projectKey}/dataset/${selectedSource.key}/issues`,
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
        open={visible}
        mask={{ closable: true }}
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
            contributesTo={projectKey}
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
  projectKey,
  project,
  setSourceDataset,
  sourceDataset,
  user,
  dataset,
}) => ({
  projectKey,
  project,
  setSourceDataset,
  sourceDataset,
  user,
  dataset,
});
export default withContext(mapContextToProps)(withRouter(SourceSelect));
