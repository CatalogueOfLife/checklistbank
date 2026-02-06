import React, { useState, useEffect } from "react";
import _ from "lodash";
import axios from "axios";

import { withRouter } from "react-router-dom";
import PageContent from "../../components/PageContent";

import withContext from "../../components/hoc/withContext";
import Layout from "../../components/LayoutNew";

import marked from "marked";
import DOMPurify from "dompurify";

const About = ({
  match: {
    params: { mdFile },
  },
}) => {
  const [md, setMd] = useState(null);

  useEffect(() => {
    if (mdFile) {
      getData();
    }
  }, [mdFile]);

  const getData = async () => {
    try {
      const res = await axios(`/metadata-md/${mdFile}.md`).then((res) => res.data);
      setMd(res);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <Layout
      openKeys={["about"]}
      selectedKeys={[mdFile]}
      title={`About - ${mdFile}`}
    >
      <PageContent>
        {md ? (
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked(md)),
            }}
          ></span>
        ) : (
          ""
        )}
      </PageContent>
    </Layout>
  );
};

export default withRouter(About);
