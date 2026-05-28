import React from "react";
import Exception403 from "../../components/exception/403";

import withContext from "../hoc/withContext";
import Layout from "../LayoutNew";
import auth from "./index.js";

// See PrivateRoute for the call-site convention; AdminRoute additionally
// checks that `user` holds one of the supplied `roles`.
const AdminRoute = ({ user, roles, children }) =>
  auth.isAuthorised(user, roles) ? (
    children
  ) : (
    <Layout openKeys={[]} selectedKeys={[]}>
      <Exception403 />
    </Layout>
  );

const mapContextToProps = ({ user, project, dataset }) => ({
  user,
  project,
  dataset,
});

export default withContext(mapContextToProps)(AdminRoute);
