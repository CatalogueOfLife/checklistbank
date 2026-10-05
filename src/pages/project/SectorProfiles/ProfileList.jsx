import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, Tag, Typography, Space, Row, Col, App } from "antd";
import { MenuOutlined, DeleteOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import ReactDragListView from "react-drag-listview";
import withContext from "../../../components/hoc/withContext";
import { getProfiles, countProfileSectors, deleteProfile, updateProfile } from "../../../api/sector";
import { setSettingNames } from "../../../components/SectorSettings/settingsMeta";
import { summarizeSelector, reorder } from "./profileUtils";

const { Text } = Typography;

// The sector profiles of a project or release in cascade order: later ones override earlier ones.
const ProfileList = ({ datasetKey, readOnly, sectorsPath, addError }) => {
  const { notification } = App.useApp();
  const [profiles, setProfiles] = useState([]);
  // profile id -> number of sectors it selects; undefined while loading, null if it failed
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const membersPath = sectorsPath || `/project/${datasetKey}/sector`;

  const load = async () => {
    setLoading(true);
    try {
      const list = await getProfiles(datasetKey);
      setProfiles(list);
      setLoading(false);
      const entries = await Promise.all(
        list.map((p) =>
          countProfileSectors(datasetKey, p.id)
            .then((n) => [p.id, n])
            .catch(() => [p.id, null])
        )
      );
      setCounts(Object.fromEntries(entries));
    } catch (err) {
      addError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [datasetKey]);

  const onDragEnd = async (fromIndex, toIndex) => {
    const { ordered, changed } = reorder(profiles, fromIndex, toIndex);
    setProfiles(ordered);
    try {
      for (const p of changed) {
        await updateProfile(datasetKey, p);
      }
    } catch (err) {
      addError(err);
    }
    load();
  };

  const onDelete = async (profile) => {
    try {
      await deleteProfile(datasetKey, profile.id);
      notification.open({ title: `Profile ${profile.title} deleted` });
    } catch (err) {
      addError(err);
    }
    load();
  };

  const countOf = (p) => {
    const n = counts[p.id];
    if (n === undefined) return "…";
    if (n === null) return "?";
    return (
      <NavLink to={{ pathname: membersPath, search: `?profileKey=${p.id}` }}>
        {n.toLocaleString("en-GB")}
      </NavLink>
    );
  };

  const columns = [
    ...(readOnly
      ? []
      : [
          {
            key: "drag",
            width: 30,
            render: () => (
              <MenuOutlined className="profile-drag-handle" style={{ cursor: "grab", color: "#999" }} />
            ),
          },
        ]),
    { title: "Position", dataIndex: "position", key: "position", width: 80 },
    {
      title: "Profile",
      key: "title",
      render: (text, p) => (
        <>
          <Text strong>{p.title}</Text>
          {p.description && (
            <div>
              <Text type="secondary">{p.description}</Text>
            </div>
          )}
        </>
      ),
    },
    { title: "Selects", key: "selector", render: (text, p) => summarizeSelector(p.selector) },
    {
      title: "Settings",
      key: "settings",
      render: (text, p) => setSettingNames(p.settings).map((n) => <Tag key={n}>{n}</Tag>),
    },
    { title: "Sectors", key: "sectors", width: 100, render: (text, p) => countOf(p) },
    ...(readOnly
      ? []
      : [
          {
            title: "Action",
            key: "action",
            width: 110,
            render: (text, p) => (
              <Space>
                <Popconfirm
                  title={`Delete profile ${p.title}?`}
                  description={`It applies to ${
                    typeof counts[p.id] === "number" ? counts[p.id].toLocaleString("en-GB") : "an unknown number of"
                  } sectors, which fall back to their other profiles and the defaults on their next sync.`}
                  onConfirm={() => onDelete(p)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]),
  ];

  const table = (
    <Table size="small" rowKey="id" columns={columns} dataSource={profiles} loading={loading} pagination={false} />
  );

  return (
    <>
      {!readOnly && (
        <Row style={{ marginBottom: "8px" }}>
          <Col flex="auto">
            <Text type="secondary">
              Profiles apply in ascending position; a later profile overrides an earlier one. Drag rows by their
              handle to reorder.
            </Text>
          </Col>
        </Row>
      )}
      {readOnly ? (
        table
      ) : (
        <ReactDragListView
          onDragEnd={onDragEnd}
          handleSelector=".profile-drag-handle"
          nodeSelector="tr.ant-table-row"
        >
          {table}
        </ReactDragListView>
      )}
    </>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });

export default withContext(mapContextToProps)(ProfileList);
