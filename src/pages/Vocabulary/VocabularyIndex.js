import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { NavLink } from "react-router-dom"
import { withRouter } from "react-router-dom";
import { Row, Col, List, Select } from "antd";
import {
  ApiOutlined,
  ApiTwoTone,
} from '@ant-design/icons';


import withContext from "../../components/hoc/withContext";
import config from "../../config";

const { Option } = Select;

const VocabularyIndex = ({ addError }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${config.dataApi}vocab`)
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  return (
    <Layout
      title="Vocabulary Index"
      openKeys={["tools"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
        <h3>ChecklistBank Vocabularies</h3>
        <p>An index to all controlled vocabularies used in ChecklistBank. 
          These vocabularies are also available through the <a href={`${config.dataApi}vocab`} target="_blank">API</a> for machines.
        </p>

        <ul>
          {data.map( (item) => (  
            <>
            <li><NavLink to={{ pathname: `/vocabulary/${item}` }} exact={true}>{item.replace("$", " ")}</NavLink>
              {item=="taxgroup" && (
                <span> (view as <NavLink to={{ pathname: `/vocabulary/taxgrouptree` }} exact={true}>tree</NavLink>)</span>
              )}
              &nbsp; <a href={`${config.dataApi}vocab/rank`} target="_blank"><ApiOutlined /></a>
            </li>
            </>
          ))}
        </ul>
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });
export default withContext(mapContextToProps)(withRouter(VocabularyIndex));
