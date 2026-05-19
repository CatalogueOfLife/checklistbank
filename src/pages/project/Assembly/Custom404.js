import { useState } from "react";
import _ from "lodash";
import ImportButton from "../../Imports/importTabs/ImportButton";
import { Button } from "antd";
import AddChildModal from "./AddChildModal";

const Custom404 = ({ error, treeType, dataset, loadRoot }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <div>
      {error.message && <h3>{error.message}</h3>}
      {_.get(error, "response.data.message") && (
        <p>{_.get(error, "response.data.message")}</p>
      )}
      {_.get(error, "response.data.details") && (
        <p>{_.get(error, "response.data.details")}</p>
      )}

      {treeType === "SOURCE" && (
        <ImportButton record={{ datasetKey: dataset.key }} />
      )}
      {treeType === "CATALOGUE" && (
        <Button type="primary" onClick={() => setModalVisible(!modalVisible)}>
          Add root taxon
        </Button>
      )}
      {modalVisible && (
        <AddChildModal
          parent={{ datasetKey: dataset.key }}
          onCancel={() => setModalVisible(false)}
          onSuccess={() => {
            setModalVisible(false);
            loadRoot();
          }}
        />
      )}
    </div>
  );
};

export default Custom404;
