import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, Typography } from "antd";
import withContext from "../../components/hoc/withContext";
import config from "../../config";
import { Image, Tree, Popover } from "antd";
import { DownOutlined } from "@ant-design/icons";

const { Title } = Typography;

const TaxGroupTree = () => {
  const [treeData, setData] = useState([]);

  useEffect(() => {
    fetch(`${config.dataApi}vocab/taxgroup`)
      .then((response) => response.json())
      .then((data) => loadTree(data));
  }, []);

  const [expandedKeys, setExpandedKeys] = useState([]);
  
  const loadTree = (array) => {
    const byNameDict = {};
    const treeData_ = [];
    var key = 1;
    array.forEach((tg) => {
      byNameDict[tg.name] = tg;
      tg["title"] = <span style={{ marginLeft: "6px" }}><Popover trigger="click" content={tg["description"]}>{tg["name"]}</Popover></span>;
      tg["children"] = [];
      tg["icon"] = <Image height={24} src={tg.iconSVG} />;
    });

    for (var entry in byNameDict) {
      // get all the data for this entry in the dictionary
      const node = byNameDict[entry];

      // if the element has a parent, add it
      if (node["parents"]) {
        node["parents"].forEach((p) => {
          node["key"] = key++;
          byNameDict[p]["children"].push({...node});
        });
      } else {
        // else is at the root level
        node["key"] = key++;
        treeData_.push(node);
      }
    }
    setData(treeData_);
    // expand all nodes with children
    var pNodes = array.filter(n => n["children"].length > 0).map(n => n["key"]);
    setExpandedKeys(pNodes);
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
              showLine={
                true
                  ? {
                      showLeafIcon: false,
                    }
                  : false
              }
              showIcon={true}
              switcherIcon={<DownOutlined />}
              defaultExpandAll={true}
              onExpand={setExpandedKeys}
              expandedKeys={expandedKeys}
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
