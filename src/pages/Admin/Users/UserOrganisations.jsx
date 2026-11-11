import React, { useState, useEffect } from "react";
import axios from "axios";
import { Row, Col, Button, List, Popconfirm, Typography, App } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import PublisherAutocomplete from "../../../components/PublisherAutocomplete";

const { Text } = Typography;

const ROLES = [
  {
    role: "orgPublisher",
    title: "Organisation publisher",
    help: "May register datasets in GBIF under these organisations. Grant it only once the organisation agreed. It gives no access to any dataset.",
    add: "Allow publishing for",
  },
  {
    role: "orgEditor",
    title: "Organisation editor",
    help: "May edit all external datasets published by these organisations, never their projects or releases.",
    add: "Allow editing the datasets of",
  },
];

/**
 * Grants and revokes the two GBIF organisation roles of a user.
 */
const UserOrganisations = ({ user, onChangeCallback, addError }) => {
  const { notification } = App.useApp();
  const [publisher, setPublisher] = useState(null);
  const [titles, setTitles] = useState({});
  const [loading, setLoading] = useState(false);
  const keys = [...(user?.orgPublisher || []), ...(user?.orgEditor || [])];

  useEffect(() => {
    keys
      .filter((k) => !titles[k])
      .forEach((k) =>
        axios(`${config.dataApi}publisher/${k}`)
          .then((res) => setTitles((t) => ({ ...t, [k]: res.data?.title || k })))
          .catch(() => setTitles((t) => ({ ...t, [k]: k })))
      );
  }, [user]);

  const change = async (role, key, grant) => {
    setLoading(true);
    try {
      await axios[grant ? "post" : "delete"](`${config.dataApi}user/${user.key}/${role}/${key}`);
      notification.success({
        title: `${grant ? "Granted" : "Revoked"} ${ROLES.find((r) => r.role === role).title.toLowerCase()}`,
        description: titles[key] || publisher?.title || key,
      });
      if (typeof onChangeCallback === "function") {
        onChangeCallback();
      }
    } catch (err) {
      addError(err);
    }
    setLoading(false);
  };

  return (
    <>
      <h3 style={{ marginTop: "20px" }}>{`GBIF organisations of ${user?.username}`}</h3>
      <Row style={{ marginBottom: "10px" }}>
        <Col flex="auto">
          <PublisherAutocomplete
            autoFocus={false}
            placeHolder="Find a GBIF organisation"
            onSelectPublisher={setPublisher}
            onResetSearch={() => setPublisher(null)}
          />
        </Col>
      </Row>
      {publisher && (
        <Row style={{ marginBottom: "10px" }}>
          <Col flex="auto"></Col>
          <Col>
            {ROLES.filter(({ role }) => !(user?.[role] || []).includes(publisher.key)).map(({ role, add }) => (
              <Button
                key={role}
                type="primary"
                style={{ marginLeft: "8px" }}
                loading={loading}
                onClick={() => change(role, publisher.key, true)}
              >
                {`${add} ${publisher.title}`}
              </Button>
            ))}
          </Col>
        </Row>
      )}
      {ROLES.map(({ role, title, help }) => (
        <List
          key={role}
          size="small"
          header={
            <>
              <Text strong>{title}</Text> <Text type="secondary">{help}</Text>
            </>
          }
          dataSource={user?.[role] || []}
          locale={{ emptyText: "None" }}
          renderItem={(key) => (
            <List.Item
              actions={[
                <Popconfirm key="revoke" title={`Revoke ${title.toLowerCase()} role?`} onConfirm={() => change(role, key, false)}>
                  <Button type="link" danger icon={<DeleteOutlined />} loading={loading} />
                </Popconfirm>,
              ]}
            >
              <a href={`${config.gbifUrl}publisher/${key}`} target="_blank" rel="noreferrer">
                {titles[key] || key}
              </a>
            </List.Item>
          )}
        />
      ))}
    </>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(UserOrganisations);
