import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, Typography } from "antd";
import Layout from "../../components/LayoutNew";
import PageContent from "../../components/PageContent";
import withRouter from "../../withRouter";
import config from "../../config";
import TaxGroupTree from "./TaxGroupTree";
import TaxGroupCards from "./TaxGroupCards";

const VIEWS = ["tree", "cards"];

// The taxgroup vocabulary, shown either as its tree or as a flat set of cards
// with large icons. The view is kept in ?view= and the selected group in the
// anchor, so links to a group work in both views.
const TaxGroup = ({ location, navigate }) => {
  const [groups, setGroups] = useState([]);
  const view = new URLSearchParams(location.search).get("view");
  const activeView = VIEWS.includes(view) ? view : VIEWS[0];

  useEffect(() => {
    fetch(`${config.dataApi}vocab/taxgroup`)
      .then((response) => response.json())
      .then(setGroups);
  }, []);

  const onChange = (key) => {
    const params = new URLSearchParams(location.search);
    params.set("view", key);
    navigate(
      { pathname: location.pathname, search: `?${params}`, hash: location.hash },
      { replace: true }
    );
  };

  return (
    <Layout
      title="Taxonomic Groups"
      openKeys={["tools"]}
      selectedKeys={["vocabulary"]}
    >
      <PageContent>
        <Typography.Paragraph style={{ marginTop: "10px" }}>
          Informal and common broad grouping of large taxonomic groups (usually
          &gt; 50.000 species). These groups often are paraphyletic, but are
          convenient for broad classifications and match better the application
          of the nomenclatural codes. The icons are built from public domain
          silhouettes of <Link to="https://www.phylopic.org">PhyloPic</Link> and
          are available from the{" "}
          <a href={`${config.dataApi}vocab/taxgroup`} target="_blank">
            API
          </a>{" "}
          as SVG or PNG. Use the{" "}
          <Link to="/tools/taxgroup-parser">tax group parser</Link> to assign
          this vocabulary to your own data. You can also{" "}
          <Link to="https://github.com/CatalogueOfLife/backend/blob/master/parser/src/main/resources/parser/dicts/taxgroup/README.md">
            read more
          </Link>{" "}
          about the dictionaries supporting the parser.
        </Typography.Paragraph>

        <Tabs
          activeKey={activeView}
          onChange={onChange}
          // remount on switch so the view scrolls to the anchored group
          destroyOnHidden
          items={[
            {
              key: "tree",
              label: "Tree",
              children: <TaxGroupTree groups={groups} />,
            },
            {
              key: "cards",
              label: "Cards",
              children: <TaxGroupCards groups={groups} />,
            },
          ]}
        />
      </PageContent>
    </Layout>
  );
};

export default withRouter(TaxGroup);
