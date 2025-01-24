import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { withRouter } from "react-router-dom";
import { Row, Col, Typography } from "antd";
import withContext from "../../components/hoc/withContext";
import config from "../../config";
import { Image, Tree, Popover } from "antd";
import { DownOutlined } from "@ant-design/icons";
import qs from "query-string";

const { Title } = Typography;

const TaxGroupTreeNodeTitle = ({ tg, poVisible = false }) => {
  const [popOverVisible, setPopOverVisible] = useState(poVisible);

  return (
    <span
      style={{ marginLeft: "6px" }}
      onClick={() => setPopOverVisible(!popOverVisible)}
    >
      <Popover
        trigger={"click"}
        visible={popOverVisible}
        content={tg["description"]}
      >
        {tg["name"]}
      </Popover>
    </span>
  );
};

const TaxGroupTree = ({ location }) => {
  const [treeData, setData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    fetch(`${config.dataApi}vocab/taxgroup`)
      .then((response) => response.json())
      .then((data) => loadTree(data));
  }, []);

  const loadTree = (array) => {
    const byNameDict = {};
    const treeData_ = [];
    var key = 1;
    const queryparams = qs.parse(location.search);
    const selectedKeys_ = [];
    array.forEach((tg) => {
      byNameDict[tg.name] = tg;
      tg["title"] = (
        <TaxGroupTreeNodeTitle
          tg={tg}
          poVisible={tg.name === queryparams["taxgroup"]}
        />
      );
      tg["children"] = [];
      tg["icon"] = <Image height={24} src={tg.iconSVG} />;
    });

    for (var entry in byNameDict) {
      // get all the data for this entry in the dictionary
      const node = byNameDict[entry];
      node["key"] = key++;
      if (node["name"] === queryparams["taxgroup"]) {
        selectedKeys_.push(node["key"]);
      }
      // if the element has a parent, add it
      if (node["parents"]) {
        node["parents"].forEach((p) => {
          // node["key"] = key++;
          byNameDict[p]["children"].push({ ...node });
        });
      } else {
        // else is at the root level
        // node["key"] = key++;
        treeData_.push(node);
      }
    }
    setSelectedKeys(selectedKeys_);
    setData(treeData_);
    // expand all nodes with children
    var pNodes = array
      .filter((n) => n["children"].length > 0)
      .map((n) => n["key"]);
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
              onSelect={(selectedKeys, info) => {
                setSelectedKeys(selectedKeys);
              }}
              selectedKeys={selectedKeys}
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
