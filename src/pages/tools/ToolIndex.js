import React, { useEffect, useState } from "react";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import { NavLink } from "react-router-dom"
import { withRouter } from "react-router-dom";
import { Avatar, List, Typography } from 'antd';
const { Text, Link } = Typography;


const data = [
  {
    title: 'Dataset Comparison',
    path: '/tools/dataset-comparison',
    description: <>
    <p>Compare parts of two datasets, e.g. the treatment of a genus or family.
      It allows you to first visualise metrics about the group and then dive into the comparison of names using
      unix diff tools to spot missing names or spelling variations.
    </p>
    </>,
  },
  {
    title: 'Taxonomic Alignment',
    path: '/tools/namesindex',
    description: <>
    <p>This tool allows you to compare the taxonomic concepts of two selected datasets in ChecklistBank or parts of it.
       It analyses the synonymy of taxa, aligns them and creates RCC-5 relationships regardless the accepted name was used.
       The alignments require synonymy to be present in both datasets to be meaningful.
       Read more about the <a href="https://github.com/jar398/listtools/blob/main/doc/guide.md#semantics">semantics of listtools</a>.</p>
    </>,
  },
  {
    title: 'GBIF Impact',
    path: '/tools/namesindex',
    description: <>
    <p>
      This tool compares taxonomic interpretation of <a href="https://www.gbif.org/occurrence/search">GBIF occurrence records</a> between the current GBIF taxonomic backbone and the Catalogue of Life.
    </p>
    </>,
  },
  {
    title: 'Archive Validator',
    path: '/tools/validator',
    description: <>
      <p>You can upload archives in different file formats supported by ChecklistBank to validate and preview it's data:{" "}
        <a href="/about/formats#catalogue-of-life-data-package-coldp">ColDP</a>,{" "}
        <a href="/about/formats#darwin-core-archive-dwc-a">DwC Archives</a> or {" "}
        <a href="/about/formats#texttree">TextTree</a>.
      </p>
    </>
  },
];

const ToolIndex = () => {

  return (
    <Layout
      title="Tools Index"
      openKeys={["toolsIndex"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
        <h2>ChecklistBank Tools</h2>
        <p>ChecklistBank comes with various tools, some of which require a login and are not visible in the menu until you have logged in. 
        </p>
        <p>Please log in to use the following additional tools:
        </p>
        <br/>

        <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                title={<a href={item.path}>{item.title}</a>}
                description={item.description}
              />
            </List.Item>
          )}
        />

      </PageContent>
    </Layout>
  );
};

export default withRouter(ToolIndex);
