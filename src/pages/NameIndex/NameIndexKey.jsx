import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import { Tabs, Table } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry from "./Entry";
import RelatedNames from "./RelatedNames";
import UsageExtension from "./UsageExtension";
import axios from "axios";
import config from "../../config";
import history from "../../history";
import _ from "lodash";

// Group tab: the authorship-qualified scientific names bucketed under this
// canonical names index entry, with how many name usages carry each exact
// label. Most frequent first.
const groupColumns = [
  {
    title: "Name",
    dataIndex: "label",
    key: "label",
  },
  {
    title: "Count",
    dataIndex: "count",
    key: "count",
    width: 120,
    align: "right",
    render: (count) => Number(count || 0).toLocaleString(),
  },
];

const NameIndexKey = ({ match, addError }) => {
  const [record, setRecord] = useState(null);
  const [count, updateCount] = useState(0);
  const [activeKey, setActiveKey] = useState("1");
  const sections = {
    "2": "group",
    "3": "related",
    "4": "properties",
    "5": "vernacular",
    "6": "distribution",
    "7": "media",
  };
  const sectionToKey = _.invert(sections);

  useEffect(() => {
    const init = async () => {
      setRecord(null);
      const {
        params: { key, section },
      } = match;
      setActiveKey(sectionToKey[section] || "1");
      try {
        const res = await axios(`${config.dataApi}nidx/${key}`);
        if (res?.data) {
          setRecord(res?.data);
        }
      } catch (err) {
        addError(err);
      }
      try {
        // Same endpoint the Related tab renders from, so the count matches the
        // rows shown (limit=1 — we only need the envelope's total).
        const relatedres = await axios(
          `${config.dataApi}nidx/${key}/usages?limit=1`
        );
        if (relatedres?.data) {
          updateCount(relatedres?.data?.total);
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
        pathname: `/namesindex/${key}/${sections[activeKey]}`,
      });
    } else {
      history.replace({
        pathname: `/namesindex/${key}`,
      });
    }
  };

  // Copy before sorting so the source record's labels array is left untouched.
  const labels = [...(record?.labels || [])].sort(
    (a, b) => (b.count || 0) - (a.count || 0)
  );

  return (
    <Layout
      title={record ? record.scientificName : ""}
      openKeys={["tools"]}
      selectedKeys={["nameIndexKey"]}
      taxonOrNameKey={record?.nidx}
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
            ...(labels.length
              ? [
                  {
                    key: "2",
                    label: `Group (${labels.length})`,
                    children: (
                      <Table
                        size="small"
                        columns={groupColumns}
                        dataSource={labels}
                        rowKey="label"
                        pagination={false}
                      />
                    ),
                  },
                ]
              : []),
            {
              key: "3",
              label: <span>Related ({count})</span>,
              children: <RelatedNames />,
            },
            {
              key: "4",
              label: "Properties",
              children: record && (
                <UsageExtension
                  nidxKey={record.nidx}
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
                  nidxKey={record.nidx}
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
                  nidxKey={record.nidx}
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
                  nidxKey={record.nidx}
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
