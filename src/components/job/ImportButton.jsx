import { useState } from "react";
import { WarningOutlined } from "@ant-design/icons";
import { Button, Popover, Popconfirm, App } from "antd";
import axios from "axios";
import config from "../../config";
import ErrorMsg from "../ErrorMsg";
import { isQueued, isLive } from "../../api/job";

/**
 * Import / Reimport / Stop / Cancel for one dataset.
 *
 * Still driven by the dedicated /importer endpoints rather than the generic
 * job API: those carry their own editor role check and take a dataset key,
 * which is what every call site has.
 *
 * Given the data source of the dataset ({ url, format } from its "data access"
 * and "data format" settings) an import first asks for confirmation, showing
 * where the data is pulled from.
 */
const ImportButton = ({ record, style, reImport, source, onStartImportSuccess, onDeleteSuccess }) => {
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
        const name = record.dataset?.title || `dataset ${record.datasetKey}`;
        if (!isQueued(record.status)) {
          notification.open({
            title: "Import stopped",
            description: `Import of ${name} was stopped`,
          });
        } else {
          notification.open({
            title: "Import canceled",
            description: `${name} was removed from the queue`,
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

  // A queued or running import can be stopped; anything else offers a (re)start.
  const isStopButton = isLive(record.status);
  const confirmImport = !isStopButton && !reImport && !!source?.url;

  const button = (
    <Button
      name="import-button"
      style={style}
      type="primary"
      danger={isStopButton}
      loading={importTriggered}
      onClick={
        confirmImport
          ? undefined
          : isStopButton
          ? stopImport
          : reImport
          ? reImportFn
          : startImport
      }
    >
      {!isStopButton && (reImport ? "Reimport" : "Import")}
      {isStopButton && !isQueued(record.status) && "Stop import"}
      {isStopButton && isQueued(record.status) && "Cancel"}
    </Button>
  );

  return (
    <>
      {confirmImport ? (
        <Popconfirm
          placement="bottomRight"
          title="Import the data from"
          description={
            <div style={{ maxWidth: 420 }}>
              <div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ wordBreak: "break-all" }}
                >
                  {source.url}
                </a>
              </div>
              <div style={{ marginTop: 4 }}>
                Format:{" "}
                {source.format || "not set, detected from the archive"}
              </div>
            </div>
          }
          okText="Import"
          onConfirm={startImport}
        >
          {button}
        </Popconfirm>
      ) : (
        button
      )}
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

export default ImportButton;
