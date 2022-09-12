import React, { useState, useEffect, useRef } from "react";
import { Tree, AutoComplete, Skeleton, Row, Col , Button} from "antd";
import PageContent from "../../../components/PageContent";
import axios from "axios";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import { parse } from "../../../components/util/textTree";

const ImportTree = ({ datasetKey, attempt, addError }) => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [dataList, setDataList] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const treeRef = useRef();
  useEffect(() => {
    getData();
  }, [datasetKey, attempt]);

  useEffect(() => {}, [searchValue]);

  const getData = async () => {
    try {
      setLoading(true);
      const textTree = await axios(
        `${config.dataApi}dataset/${datasetKey}/import/${attempt}/tree`
      );
      const lines = textTree.data.split("\n");
      setDataList(lines.map((l, i) => ({ value: i, label: l.trim() })));
      const tree = parse(lines, "  ");
      setTreeData(tree.root);
      setLoading(false);
    } catch (error) {
      addError(error);
      setLoading(false);
    }
  };

  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onSelect = (data) => {
    const taxon = dataList[data];
    setSearchValue(taxon.label);
    setAutoExpandParent(true);

    setExpandedKeys([data]);
    setTimeout(() => {
      if (treeRef?.current) {
        treeRef.current.scrollTo({
          key: data,
        });
      }
    }, 100);
  };

  return (
    <PageContent>
      <Row>
        <Col>
        <AutoComplete
        allowClear
        onClear={() => setSearchValue("")}
        options={
          searchValue && searchValue.length > 2
            ? dataList.filter((e) =>
                e.label
                  .toLowerCase()
                  .replace("*", "")
                  .startsWith(searchValue.toLowerCase())
              )
            : dataList
        }
        onSearch={setSearchValue}
        value={searchValue}
        onSelect={onSelect}
        style={{
          width: "400px",
          marginBottom: 8,
        }}
        placeholder="Search"
        // onChange={onChange}
      />
      </Col><Col>
        <Button onClick={() => {
          setExpandedKeys([]);
          setAutoExpandParent(false);
          setSearchValue('');

        }}>
          Refresh
        </Button>
      </Col></Row>
      

      {loading && <Skeleton paragraph={{ rows: 10 }} active />}

      <Tree
        ref={treeRef}
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        filterTreeNode={(node) => {
          return node.key === expandedKeys?.[0];
        }}
        autoExpandParent={autoExpandParent}
        treeData={treeData}
        height={700}
        virtual={true}
      />
    </PageContent>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(ImportTree);
