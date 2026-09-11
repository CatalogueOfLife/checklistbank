import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import withContext from "../../components/hoc/withContext";
import { List, Tag } from "antd";
import toolsDescriptions from "./toolsMeta";

// Every tool in ChecklistBank, including those left out of the menu.
// `access` mirrors the menu gating: "login" needs any logged in user,
// "editor" needs the editor or admin role.
const tools = [
  {
    title: "Cross dataset search",
    path: "/nameusage/search",
    id: "nameusage-search",
  },
  {
    title: "Names index search",
    path: "/namesindex",
    id: "namesindex",
    access: "editor",
  },
  { title: "Name matching", path: "/tools/name-match", id: "name-match" },
  { title: "Name parser", path: "/tools/name-parser", id: "name-parser" },
  {
    title: "Taxon group parser",
    path: "/tools/taxgroup-parser",
    id: "taxgroup-parser",
  },
  {
    title: "Dataset comparison",
    path: "/tools/dataset-comparison",
    id: "dataset-comparison",
    access: "login",
  },
  {
    title: "Diff viewer",
    path: "/tools/diff-viewer",
    id: "diff-viewer",
    access: "editor",
  },
  {
    title: "Archive validator",
    path: "/tools/validator",
    id: "validator",
    access: "login",
  },
  { title: "Vocabularies", path: "/vocabulary", id: "vocabulary" },
  {
    title: "Metadata generator",
    path: "/tools/metadata-generator",
    id: "metadata-generator",
  },
  {
    title: "Taxonomic alignment",
    path: "/tools/taxonomic-alignment",
    id: "taxonomic-alignment",
    access: "login",
  },
  {
    title: "GBIF impact",
    path: "/tools/gbif-impact",
    id: "gbif-impact",
    access: "editor",
  },
];

const ACCESS_TAG = {
  login: <Tag>Login required</Tag>,
  editor: <Tag color="orange">Editors only</Tag>,
};

const ToolIndex = ({ user }) => {
  return (
    <Layout
      title="Tools Index"
      openKeys={["tools"]}
      selectedKeys={["toolsIndex"]}
    >
      <PageContent>
        <h2>ChecklistBank Tools</h2>
        <p>
          ChecklistBank comes with various tools. Some of them require a login
          or editor rights and are only shown in the menu to users who have
          them.
          {!user && " Please log in to use the tools marked as such."}
        </p>
        <br />

        <List
          itemLayout="horizontal"
          dataSource={tools}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <>
                    <Link to={item.path}>{item.title}</Link>{" "}
                    {item.access && ACCESS_TAG[item.access]}
                  </>
                }
                description={toolsDescriptions[item.id]}
              />
            </List.Item>
          )}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ user }) => ({ user });

export default withRouter(withContext(mapContextToProps)(ToolIndex));
