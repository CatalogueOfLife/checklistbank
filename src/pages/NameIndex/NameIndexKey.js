import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Card, Tabs, Table, Button } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry, { Authorship } from "./Entry";
import RelatedNames from "./RelatedNames";
import axios from "axios";
import config from "../../config";
import history from "../../history";

const { TabPane } = Tabs;



const NameIndexKey = ({ match, addError }) => {
  const [record, setRecord] = useState(null);
  const [group, setGroup] = useState(null);
  const [count, updateCount] = useState(0);
  const [activeKey, setActiveKey] = useState("1");
  const [defaultFilteredValue, setDefaultFilteredValue] = useState(null)
  const sections = {
    "2": "group",
    "3": "related"
  };

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
      setActiveKey(section === "related" ? "3": section === "group" ? "2": "1")
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
    if(sections[activeKey]){
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
        <Tabs activeKey={activeKey} onChange={onTabChange} defaultActiveKey="1">
          <TabPane tab="Entry" key="1">
            {record && <Entry record={record} />}
          </TabPane>
          {group && (
            <TabPane tab={`Group (${group.length})`} key="2">
              <Table
                size="small"
                columns={columns}
                dataSource={group}
                /*  pagination={this.state.pagination}
      onChange={this.handleTableChange} */
                rowKey="id"
                pagination={false}
                expandable={{
                  expandedRowRender: (record) => <Entry record={record} />,
                }}
              />
            </TabPane>
          )}
          <TabPane tab={<span>Related ({count})</span>} key="3">
            <RelatedNames updateCount={updateCount} group={group ? [record, ...group] : []} defaultFilteredValue={defaultFilteredValue} />
          </TabPane>
        </Tabs>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(NameIndexKey));
