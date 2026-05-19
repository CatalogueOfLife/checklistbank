import { useEffect, useState } from "react";
import withContext from "../../components/hoc/withContext";
import withRouter from "../../withRouter";
import config from "../../config";
import _ from "lodash";
import { SettingOutlined } from "@ant-design/icons";
import { Modal, Select, Typography } from "antd";
import history from "../../history";
import { truncate } from "../../components/util";

// import DatasetAutocomplete from "../project/Assembly/DatasetAutocomplete";

import axios from "axios";
const {Text, Link} = Typography;

/* function truncate(str, n){
  return (str?.length > n) ? str.substr(0, n-1) + '...' : str;
}; */

const CatalogueSelect = ({ match, location, catalogue, setCatalogue, user, iconOnly = false, style = {} }) => {
  const { params: { projectKey } } = match;
  const [catalogues, setCatalogues] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCatalogues = () => {
    setLoading(true);
    axios(
      `${config.dataApi}dataset?origin=project&limit=1000`
    ).then((res) =>
      setCatalogues(_.get(res, "data.result") ? _.get(res, "data.result") : [])
    ).finally(() => setLoading(false));
  };

  useEffect(() => {
    getCatalogues();
  }, []);

  const hide = () => {
    setVisible(false);
  };

  const onCatalogueChange = (newCatalogueKey) => {
    if (projectKey) {
      const newPath = _.get(location, "pathname", "").replace(
        `project/${projectKey}/`,
        `project/${newCatalogueKey}/`
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
    setVisible(false);
  };

  return (
    <>
      <a
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          setVisible(true);
        }}
      >
        {iconOnly && <SettingOutlined />}
        {!iconOnly && catalogue &&
          `${catalogue?.alias ? catalogue.alias : truncate(catalogue?.title, 25)} [${catalogue.key}]`
        }
        {!iconOnly && !catalogue && `Select`}

      </a>
      <Modal
        title="Select project"
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
          <Select
            showSearch
            loading={loading}
            style={{ width: "100%" }}
            value={projectKey || null}
            placeholder="Select project"
            optionFilterProp="label"
            onChange={onCatalogueChange}
            filterOption={(input, option) =>
              option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onOpenChange={(open) => {
              if (open) {
                getCatalogues();
              }
            }}
            options={catalogues.map((c) => ({
              value: c.key,
              label: `${c.alias ? c.alias : truncate(c.title, 50)} [${c.key}]`,
            }))}
          />
        </div>
      </Modal>
    </>
  );
};

const mapContextToProps = ({
  projectKey,
  catalogue,
  setCatalogue,
  user,
}) => ({
  projectKey,
  catalogue,
  setCatalogue,
  user,
});
export default withContext(mapContextToProps)(withRouter(CatalogueSelect));
