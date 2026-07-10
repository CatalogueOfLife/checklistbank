import { Space, Tag } from "antd";

const DiffStats = ({ diff }) => {
  if (!diff) return null;
  const removed = diff.removedCount ?? diff.removed?.length ?? 0;
  const added = diff.addedCount ?? diff.added?.length ?? 0;
  const changed = diff.changedCount ?? diff.changed?.length ?? 0;
  return (
    <Space wrap>
      <Tag color="red">Removed −{removed}</Tag>
      <Tag color="green">Added +{added}</Tag>
      <Tag color="gold">Changed ~{changed}</Tag>
      {diff.truncated && (
        <Tag color="warning">Truncated — showing a partial diff</Tag>
      )}
    </Space>
  );
};

export default DiffStats;
