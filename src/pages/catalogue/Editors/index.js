import React, { useState, useEffect } from "react";
import config from "../../../config";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { Table, Row, Col, Tag, Button, notification } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import Userautocomplete from "./UserAutocomplete";
import axios from "axios";

const ProjectEditors = ({ user, catalogueKey, catalogue, addError }) => {
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Firstname",
      dataIndex: "firstname",
      key: "firstname",
    },
    {
      title: "Lastname",
      dataIndex: "lastname",
      key: "lastname",
    },
    {
      title: "Orcid",
      dataIndex: "orcid",
      key: "orcid",
      render: (text, record) =>
        record.orcid ? (
          <a
            style={{ display: "block" }}
            href={`https://orcid.org/${record.orcid}`}
          >
            <img
              src="/images/orcid_16x16.png"
              style={{ flex: "0 0 auto" }}
              alt=""
            ></img>{" "}
            {record.orcid}
          </a>
        ) : null,
    },
    {
      title: "Remove",
      dataIndex: "",
      key: "Remove",
      render: (text, record) => (
        <Button type="link" onClick={() => deleteEditor(record)}>
          <DeleteOutlined />
        </Button>
      ),
    },
  ];

  const getData = async () => {
    setLoading(true);
    const res = await axios(`${config.dataApi}dataset/${catalogueKey}/editor`);
    setEditors(res.data);
    setLoading(false);
  };

  const deleteEditor = async (usr) => {
    try {
      await axios.delete(
        `${config.dataApi}dataset/${catalogueKey}/editor/${usr.key}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      notification.success({
        message: "Removed editor",
        description: usr.title,
      });
    } catch (err) {
      addError(err);
    }
    getData();
  };

  const addEditors = async () => {
    for (const usr of users) {
      try {
        await axios.post(
          `${config.dataApi}dataset/${catalogueKey}/editor`,
          usr.key,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        notification.success({
          message: "Added editor",
          description: usr.title,
        });
      } catch (err) {
        addError(err);
      }
    }
    setUsers([]);
    getData();
  };

  useEffect(() => {
    getData();
  }, [catalogueKey]);

  return (
    <Layout
      selectedKeys={["projectEditors"]}
      openKeys={["assembly", "projectDetails"]}
      title={catalogue ? catalogue.title : ""}
    >
      <PageContent>
        <Row>
          <Col span={12}>
            <h1>Editors</h1>
          </Col>
          <Col>
            <div style={{ marginBottom: "10px" }}>
              <Userautocomplete
                style={{ width: "300px" }}
                placeHolder="Add editor(s)"
                onSelectUser={(usr) => {
                  setUsers([...users, usr]);
                }}
              />
            </div>
            {users.map((t) => (
              <Tag
                key={t.username}
                closable
                onClose={() => {
                  setUsers([...users.filter((usr) => usr.title !== t.title)]);
                }}
              >
                {t.title}
              </Tag>
            ))}
            {users.length > 0 && (
              <Button type="primary" size="small" onClick={addEditors}>
                Make editor(s)
              </Button>
            )}
          </Col>
        </Row>

        <Table
          style={{ marginTop: "10px" }}
          size="middle"
          columns={columns}
          dataSource={editors}
          loading={loading}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ user, catalogueKey, catalogue, addError }) => ({
  user,
  catalogueKey,
  catalogue,
  addError,
});

export default withContext(mapContextToProps)(ProjectEditors);
