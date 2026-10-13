import { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Popconfirm, Row, Col, Typography, App } from "antd";
import config from "../../../config";
import { getDatasetsBatch } from "../../../api/dataset";

const { Text } = Typography;

// Bulk deletes of a project's decisions on one source dataset. The backend
// (DELETE /dataset/{projectKey}/decision?datasetKey=) requires the source, so
// this is only offered once the decision list is filtered to one.
const DeleteDecisionsModal = ({
  projectKey,
  subjectDatasetKey,
  open,
  onClose,
  onDeleted,
}) => {
  const { notification } = App.useApp();
  const [source, setSource] = useState(null);
  const [counts, setCounts] = useState({ all: null, broken: null });
  const [deleting, setDeleting] = useState(null); // null | "broken" | "all"

  useEffect(() => {
    if (!open || !subjectDatasetKey) return;
    let cancelled = false;
    setCounts({ all: null, broken: null });
    const count = (extra) =>
      axios(
        `${config.dataApi}dataset/${projectKey}/decision?subjectDatasetKey=${subjectDatasetKey}${extra}&limit=0`
      ).then((res) => res?.data?.total ?? null);
    Promise.all([
      getDatasetsBatch([subjectDatasetKey]),
      count(""),
      count("&broken=true"),
    ])
      .then(([datasets, all, broken]) => {
        if (cancelled) return;
        setSource(datasets?.[0] || null);
        setCounts({ all, broken });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, projectKey, subjectDatasetKey]);

  const deleteDecisions = (broken) => {
    const what = broken ? "broken" : "all";
    setDeleting(what);
    axios
      .delete(
        `${config.dataApi}dataset/${projectKey}/decision?datasetKey=${subjectDatasetKey}&broken=${broken}`
      )
      .then((res) => {
        notification.success({
          title: "Decisions deleted",
          description: `Deleted ${res.data} ${broken ? "broken " : ""}decisions`,
        });
        setDeleting(null);
        onDeleted();
      })
      .catch((err) => {
        notification.error({
          title: "Deleting decisions failed",
          description: err?.response?.data?.message || err?.message,
        });
        setDeleting(null);
      });
  };

  const sourceLabel = source
    ? `${source.alias || source.title} (${subjectDatasetKey})`
    : `source dataset ${subjectDatasetKey}`;
  const fmt = (n) => (n == null ? "…" : n.toLocaleString("en-GB"));

  const option = (key, title, description, count, broken) => (
    <Row
      key={key}
      align="middle"
      gutter={16}
      style={{ marginBottom: "16px" }}
    >
      <Col flex="auto">
        <div>
          <Text strong>{title}</Text> <Text type="secondary">({fmt(count)})</Text>
        </div>
        <Text type="secondary">{description}</Text>
      </Col>
      <Col>
        <Popconfirm
          placement="topRight"
          title={`Delete ${fmt(count)} ${broken ? "broken " : ""}decisions from ${sourceLabel}?`}
          description="This cannot be undone."
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
          onConfirm={() => deleteDecisions(broken)}
          disabled={count === 0 || !!deleting}
        >
          <Button
            danger
            type={broken ? "default" : "primary"}
            loading={deleting === key}
            disabled={count === 0 || (!!deleting && deleting !== key)}
          >
            Delete
          </Button>
        </Popconfirm>
      </Col>
    </Row>
  );

  return (
    <Modal
      title={`Delete decisions from ${sourceLabel}`}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      {option(
        "broken",
        "Broken decisions",
        "Decisions whose subject no longer matches a name in the source.",
        counts.broken,
        true
      )}
      {option(
        "all",
        "All decisions",
        "Every decision on this source, broken or not.",
        counts.all,
        false
      )}
    </Modal>
  );
};

export default DeleteDecisionsModal;
