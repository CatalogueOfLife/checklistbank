import { useState } from "react";
import { WarningOutlined } from '@ant-design/icons';
import { Button, Popover, App } from "antd";
import axios from "axios";
import config from "../../../config";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";

import _ from "lodash"

const SyncButton = ({ record, addError, onStartSyncSuccess, onDeleteSuccess, style, size }) => {
  const { notification } = App.useApp();
  const [importTriggered, setImportTriggered] = useState(false);
  const [error, setError] = useState(null);

  const startSync = () => {
    setImportTriggered(true);
    axios
      .post(
        `${config.dataApi}dataset/${_.get(record, 'sector.datasetKey')}/sector/sync`,
        {
          'sectorKey': _.get(record, 'sector.id'),
          'datasetKey': _.get(record, 'sector.datasetKey')
        }
      )
      .then(res => {
        setImportTriggered(false);
        notification.open({
          title: "Sync started",
          message: `Now syncyning sector ${ _.get(record, 'sector.id')}`
        })
        if(onStartSyncSuccess && typeof onStartSyncSuccess === 'function'){
          onStartSyncSuccess();
        }
      })
      .catch(err => {
        addError(err)
        setImportTriggered(false);
        setError(err);
      });
  };

  const stopSync = () => {
    setImportTriggered(true);
    axios
      .delete(`${config.dataApi}dataset/${_.get(record, 'sector.datasetKey')}/sector/${_.get(record, 'sector.id')}/sync`)
      .then(res => {
        setImportTriggered(false);
        notification.open({
          message: 'Sync canceled'
          //title: 'Sync canceled'
        })

        if(onDeleteSuccess && typeof onDeleteSuccess === 'function'){
          onDeleteSuccess();
        }

      })
      .catch(err => {
        addError(err)
        setImportTriggered(false);
        setError(err);
      });
  };

  const isStopButton = record.state && ['finished', 'canceled', 'failed'].indexOf(record.state) === -1;

  return (
    <div style={style || {}}>
      <Button
        size={size || 'default'}
        type="primary"
        danger={isStopButton}
        loading={importTriggered}
        onClick={isStopButton ? stopSync : startSync}
      >
        {!isStopButton && 'Sync'}
        {isStopButton && record.state !== 'in queue' &&  'Stop sync'}
        {isStopButton && record.state === 'in queue' &&  'Remove'}
      </Button>
      {error && (
        <Popover
          placement="bottom"
          title="Error"
          content={<ErrorMsg error={error} />}
          trigger="click"
        >
          <WarningOutlined style={{ color: "red", marginLeft: "10px", cursor: "pointer" }} />
        </Popover>
      )}
    </div>
  );
};

const mapContextToProps = ({ addError }) => ({
  addError
});

export default withContext(mapContextToProps)(SyncButton);
// export default SyncButton;
