import React, { useEffect, useState } from "react";
import { Drawer, Table } from "antd";
import DataLoader from "dataloader";
import getColumns from "../ProjectSectors/columns";
import { getDatasetsBatch } from "../../../api/dataset";
import { previewProfile } from "../../../api/sector";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids), { maxBatchSize: 100 });
const PAGE_SIZE = 50;
const COLUMNS = ["alias", "mode", "subject", "target"];

// The sectors an unsaved selector would select
const PreviewDrawer = ({ open, onClose, datasetKey, selector }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ result: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [selector]);

  useEffect(() => {
    if (!open || !selector) return;
    setLoading(true);
    previewProfile(datasetKey, selector, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
      .then(async (res) => {
        const result = res.result || [];
        await Promise.all(
          result.map((s) => datasetLoader.load(s.subjectDatasetKey).then((d) => (s.dataset = d)))
        );
        setData({ result, total: res.total || 0 });
      })
      .catch(() => setData({ result: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [open, page, selector, datasetKey]);

  return (
    <Drawer title="Sectors the selector selects" size="large" open={open} onClose={onClose}>
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={data.result}
        columns={getColumns(datasetKey, "").filter((c) => COLUMNS.includes(c.key))}
        pagination={{ current: page, pageSize: PAGE_SIZE, total: data.total, showSizeChanger: false, onChange: setPage }}
      />
    </Drawer>
  );
};

export default PreviewDrawer;
