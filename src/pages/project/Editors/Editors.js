import React, { useState, useEffect } from "react";
import config from "../../../config";
import { withRouter } from "react-router-dom";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import { Table, Row, Col, Tag, Button, Radio, notification } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import Userautocomplete from "./UserAutocomplete";
import axios from "axios";

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const Editors = ({
  user,
  datasetKey,
  catalogue,
  addError,
  countryAlpha2,
}) => {
  const [editors, setEditors] = useState([]);
  const [type, setType] = useState("editor");
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
      title: "Country",
      dataIndex: "country",
      key: "Country",
      render: (text, record) =>
        record?.country ? countryAlpha2[record.country].name : record.country,
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

  const getData = async (userType) => {
    setLoading(true);
    setEditors([]);
    const res = await axios(
      `${config.dataApi}dataset/${datasetKey}/${userType || type}`
    );
    setEditors(res.data);
    setLoading(false);
  };

  const deleteEditor = async (usr) => {
    try {
      await axios.delete(
        `${config.dataApi}dataset/${datasetKey}/${type}/${usr.key}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      notification.success({
        message: `Removed ${type}`,
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
          `${config.dataApi}dataset/${datasetKey}/${type}`,
          usr.key,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        notification.success({
          message: `Added ${type}`,
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
  }, [datasetKey]);

  return (
      <PageContent>
        <Row>
          <Col span={12}>
            <Radio.Group
              onChange={(t) => {
                console.log("Type " + t?.target?.value);
                setType(t?.target?.value);
                getData(t?.target?.value);
              }}
              value={type}
              style={{ marginBottom: 8 }}
            >
              <Radio.Button value="editor">Editors</Radio.Button>
              <Radio.Button value="reviewer">Reviewers</Radio.Button>
            </Radio.Group>
          </Col>
          <Col>
            <div style={{ marginBottom: "10px" }}>
              <Userautocomplete
                style={{ width: "300px" }}
                placeHolder={`Add ${type}(s)`}
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
                {`Make ${type}(s)`}
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
  );
};

const mapContextToProps = ({
  user,
  addError,
  countryAlpha2,
}) => ({
  user,
  addError,
  countryAlpha2,
});

export default withContext(mapContextToProps)(Editors);
