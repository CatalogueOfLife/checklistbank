import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import { Card, Tabs, Table, Button } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry, { Authorship } from "./Entry";
import RelatedNames from "./RelatedNames";
import UsageExtension from "./UsageExtension";
import axios from "axios";
import config from "../../config";
import history from "../../history";
import _ from "lodash";




const NameIndexKey = ({ match, addError }) => {
  const [record, setRecord] = useState(null);
  const [group, setGroup] = useState(null);
  const [count, updateCount] = useState(0);
  const [activeKey, setActiveKey] = useState("1");
  const [defaultFilteredValue, setDefaultFilteredValue] = useState(null)
  const sections = {
    "2": "group",
    "3": "related",
    "4": "properties",
    "5": "vernacular",
    "6": "distribution",
    "7": "media",
  };
  const sectionToKey = _.invert(sections);

  const columns = [
    {
      title: "Scientific Name",
      dataIndex: ["scientificName"],
      key: "scientificName",
      /* render: (text, record) => <Button type="link" onClick={() => {
        setDefaultFilteredValue(record.id)
        setActiveKey("3")
      }}>{text}</Button>, */
      width: 200,
    },
    {
      title: "Rank",
      dataIndex: ["rank"],
      key: "rank",

      width: 100,
    },
    {
      title: "Basionym Authorship",
      dataIndex: ["basionymAuthorship"],
      key: "basionymAuthorship",
      render: (text, record) =>
        record?.basionymAuthorship ? (
          <Authorship author={record?.basionymAuthorship} />
        ) : (
          ""
        ),
      width: 200,
    },

    {
      title: "Combination Authorship",
      dataIndex: ["combinationAuthorship"],
      key: "combinationAuthorship",
      render: (text, record) =>
        record?.combinationAuthorship ? (
          <Authorship author={record?.combinationAuthorship} />
        ) : (
          ""
        ),
      width: 200,
    },
  ];

  useEffect(() => {
    const init = async () => {
      setRecord(null);
      setGroup(null);
      const {
        params: { key, section },
      } = match;
      setActiveKey(sectionToKey[section] || "1")
      try {
        const res = await axios(`${config.dataApi}nidx/${key}`);
        if (res?.data) {
          setRecord(res?.data);
        }
      } catch (err) {
        addError(err);
      }
      try {
        const groupres = await axios(`${config.dataApi}nidx/${key}/group`);

        if (groupres?.data) {
          setGroup(groupres?.data);
        }
      } catch (err) {
        if (err?.response?.status > 499) {
          addError(err);
        }
      }
      try {
        const relatedres = await axios(
          `${config.dataApi}nameusage?nidx=${key}`
        );
        if (relatedres?.data) {
          if (typeof updateCount === "function") {
            updateCount(relatedres?.data?.total);
          }
        }
      } catch (err) {
        if (err?.response?.status > 499) {
          addError(err);
        }
      }
    };
    init();
  }, [match?.params?.key]);

  const onTabChange = (activeKey) => {
    setActiveKey(activeKey);
    const {
      params: { key },
    } = match;
    if (sections[activeKey]) {
      history.replace({
        pathname: `/namesindex/${key}/${sections[activeKey]}`
      });
    } else {
      history.replace({
        pathname: `/namesindex/${key}`
      });
    }
  }

  return (
    <Layout
      title={
        record ? (
          <span dangerouslySetInnerHTML={{ __html: record.labelHtml }} />
        ) : (
          ""
        )
      }
      openKeys={["tools"]}
      selectedKeys={["nameIndexKey"]}
      taxonOrNameKey={record?.id}
    >
      <PageContent>
        <Tabs
          activeKey={activeKey}
          onChange={onTabChange}
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "Entry",
              children: record && <Entry record={record} />,
            },
            ...(group
              ? [
                  {
                    key: "2",
                    label: `Group (${group.length})`,
                    children: (
                      <Table
                        size="small"
                        columns={columns}
                        dataSource={group}
                        rowKey="id"
                        pagination={false}
                        expandable={{
                          expandedRowRender: (record) => (
                            <Entry record={record} />
                          ),
                        }}
                      />
                    ),
                  },
                ]
              : []),
            {
              key: "3",
              label: <span>Related ({count})</span>,
              children: (
                <RelatedNames
                  updateCount={updateCount}
                  group={group ? [record, ...group] : []}
                  defaultFilteredValue={defaultFilteredValue}
                />
              ),
            },
            {
              key: "4",
              label: "Properties",
              children: record && (
                <UsageExtension
                  nidxKey={record.id}
                  endpoint="property"
                  description="Taxon properties — key/value facts such as life habit or motility — recorded for usages of this name across all ChecklistBank datasets."
                  columns={[
                    { title: "Property", dataIndex: "property", key: "property", width: 220 },
                    { title: "Value", dataIndex: "value", key: "value" },
                    { title: "Page", dataIndex: "page", key: "page", width: 120 },
                  ]}
                />
              ),
            },
            {
              key: "5",
              label: "Vernacular",
              children: record && (
                <UsageExtension
                  nidxKey={record.id}
                  endpoint="vernacular"
                  description="Common (vernacular) names recorded for usages of this name across all ChecklistBank datasets."
                  columns={[
                    { title: "Name", dataIndex: "name", key: "name" },
                    { title: "Language", dataIndex: "language", key: "language", width: 100 },
                    { title: "Transliteration", dataIndex: "latin", key: "latin" },
                    {
                      title: "Area",
                      key: "area",
                      width: 140,
                      render: (text, r) => r.area || r.country || "",
                    },
                  ]}
                />
              ),
            },
            {
              key: "6",
              label: "Distribution",
              children: record && (
                <UsageExtension
                  nidxKey={record.id}
                  endpoint="distribution"
                  description="Geographic distributions recorded for usages of this name across all ChecklistBank datasets."
                  columns={[
                    {
                      title: "Area",
                      key: "area",
                      render: (text, r) => r?.area?.name,
                    },
                    {
                      title: "Gazetteer",
                      key: "gazetteer",
                      width: 120,
                      render: (text, r) => r?.area?.gazetteer,
                    },
                    {
                      title: "Establishment Means",
                      dataIndex: "establishmentMeans",
                      key: "establishmentMeans",
                      width: 160,
                    },
                    {
                      title: "Status",
                      dataIndex: "threatStatus",
                      key: "threatStatus",
                      width: 140,
                    },
                  ]}
                />
              ),
            },
            {
              key: "7",
              label: "Media",
              children: record && (
                <UsageExtension
                  nidxKey={record.id}
                  endpoint="media"
                  gallery
                  description="Images and other media linked to usages of this name across all ChecklistBank datasets."
                />
              ),
            },
          ]}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(NameIndexKey));
