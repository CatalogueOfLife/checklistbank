import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, Typography } from "antd";
import withContext from "../../components/hoc/withContext";
import config from "../../config";
import { Image, Tree, Select } from 'antd'
import {DownOutlined, SmallDashOutlined, CheckOutlined} from '@ant-design/icons';

const { Title } = Typography;

const TaxGroupTree = () => {
  const [treeData, setData] = useState([]);

  useEffect(() => {
    fetch(`${config.dataApi}vocab/taxgroup`)
      .then((response) => response.json())
      .then((data) => loadTree(data));
  }, []);

  const onSelect = (selectedKeys, info) => {
    console.log('show description', selectedKeys, info);
  };

  const loadTree = (array) => {
    const arrayDictionary = {};
    array.forEach((tg) => {
      arrayDictionary[tg.name] = tg;
      tg["title"] = tg["name"];
      tg["key"] = tg["name"];
      tg["children"] = [];
      tg["icon"] = <Image src={tg.iconSVG} />;
    });

    for (var entry in arrayDictionary) {

      // get all the data for this entry in the dictionary
      const mappedElem = arrayDictionary[entry];

      // if the element has a parent, add it
      if (mappedElem["parents"]) {
        mappedElem["parents"].forEach( p => {
          arrayDictionary[p]["children"].push(mappedElem);
        })
      }
      // else is at the root level
      else {
        treeData.push(mappedElem);
      }
    }
    
    console.log(treeData);
    setData(treeData);
  };
  
  return (
    <Layout
      title={`Taxonomic Groups`}
      openKeys={["tools"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
      
        <Row style={{ marginTop: "10px" }}>
          <Col flex="auto">
              <Tree
      showLine={true
          ? {
              showLeafIcon: false
            }
          : false
      }
      showIcon={true}
      switcherIcon={<DownOutlined />}
      defaultExpandAll={true}
      onSelect={onSelect}
      treeData={treeData}
    />
          </Col>
        </Row>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = () => ({});
export default withContext(mapContextToProps)(withRouter(TaxGroupTree));
