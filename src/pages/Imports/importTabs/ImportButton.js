import { useState } from "react";
import { WarningOutlined } from "@ant-design/icons";
import { Button, Popover, App } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";

const ImportButton = ({ record, style, importState, reImport, onStartImportSuccess, onDeleteSuccess }) => {
  const { notification } = App.useApp();
  const [importTriggered, setImportTriggered] = useState(false);
  const [error, setError] = useState(null);

  const reImportFn = () => {
    setImportTriggered(true);
    axios
      .post(`${config.dataApi}importer/${record.datasetKey}/reimport`, {
        datasetKey: record.datasetKey,
        priority: true,
        force: true,
      })
      .then((res) => {
        setImportTriggered(false);
        if (
          onStartImportSuccess &&
          typeof onStartImportSuccess === "function"
        ) {
          onStartImportSuccess();
        }
      })
      .catch((err) => {
        setImportTriggered(false);
        setError(err);
      });
  };

  const startImport = () => {
    setImportTriggered(true);
    axios
      .post(`${config.dataApi}importer`, {
        datasetKey: record.datasetKey,
        priority: true,
        force: true,
      })
      .then((res) => {
        setImportTriggered(false);
        if (
          onStartImportSuccess &&
          typeof onStartImportSuccess === "function"
        ) {
          onStartImportSuccess();
        }
      })
      .catch((err) => {
        setImportTriggered(false);
        setError(err);
      });
  };

  const stopImport = () => {
    setImportTriggered(true);
    axios
      .delete(`${config.dataApi}importer/${record.datasetKey}`)
      .then((res) => {
        setImportTriggered(false);
        if (record.state !== "waiting") {
          notification.open({
            title: "Import stopped",
            description: `Import of ${record.dataset.title} was stopped`,
          });
        } else {
          notification.open({
            title: "Import canceled",
            description: `${record.dataset.title} was removed from the queue`,
          });
        }

        if (
          onDeleteSuccess &&
          typeof onDeleteSuccess === "function"
        ) {
          onDeleteSuccess();
        }
      })
      .catch((err) => {
        setImportTriggered(false);
        setError(err);
      });
  };

  const isStopButton =
    [
      "waiting",
      ...importState.filter((i) => i.running).map((i) => i.name),
    ].indexOf(record.state) > -1;

  return (
    <>
      <Button
        name="import-button"
        style={style}
        type={isStopButton ? "danger" : "primary"}
        loading={importTriggered}
        onClick={isStopButton ? stopImport : reImport ? reImportFn : startImport}
      >
        {!isStopButton && (reImport ? "Reimport" : "Import")}
        {isStopButton && record.state !== "waiting" && "Stop import"}
        {isStopButton && record.state === "waiting" && "Cancel"}
      </Button>
      {error && (
        <Popover
          placement="bottom"
          title="Error"
          content={<ErrorMsg error={error} />}
          trigger="click"
        >
          <WarningOutlined
            style={{ color: "red", marginLeft: "10px", cursor: "pointer" }}
          />
        </Popover>
      )}
    </>
  );
};

const mapContextToProps = ({ importState }) => ({ importState });
export default withContext(mapContextToProps)(ImportButton);
