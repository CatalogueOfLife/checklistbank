import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Card, Tabs, Badge } from "antd";
import withContext from "../../components/hoc/withContext";
import Entry from "./Entry";
import RelatedNames from "./RelatedNames";
import axios from "axios";
import config from "../../config";

const { TabPane } = Tabs;

const NameIndexKey = ({ match, addError }) => {
  const [record, setRecord] = useState(null);
  const [group, setGroup] = useState(null);
  const [count, updateCount] = useState(0)
  useEffect(() => {
    const init = async () => {
        setRecord(null)
        setGroup(null)
      const {
        params: { key },
      } = match;
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
          if(err?.response?.status > 499){
            addError(err);
          }
      }
      try {
        const relatedres = await axios(`${config.dataApi}nameusage?nidx=${key}`);
        if (relatedres?.data) {
          if(typeof updateCount === "function"){
            updateCount(relatedres?.data?.total)
          }
        }
        
      } catch (err) {
        if(err?.response?.status > 499){
            addError(err);
          }
      }

     

    };
    init();
  }, [match]);

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
        <Tabs defaultActiveKey="1">
          <TabPane tab="Entry" key="1">
            {record && <Entry record={record} />}
          </TabPane>
          {group && <TabPane tab="Group" key="2">
            {group.map(e => <Card style={{marginBottom: "10px"}}>
                <Entry record={e} />
            </Card>)}
          </TabPane>}
         <TabPane tab={<span>Related ({count})</span>} key="3">
            <RelatedNames updateCount={updateCount} />
          </TabPane>
        </Tabs>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(NameIndexKey));
