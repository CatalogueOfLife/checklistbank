import React from "react";
import Exception403 from "../../components/exception/403";

import withContext from "../hoc/withContext";
import Layout from "../LayoutNew";
import auth from "./index.js";

// Router 6 dropped the render-prop pattern that the previous version used.
// Call sites now wrap the protected element directly:
//   <Route path="..." element={<PrivateRoute><Page /></PrivateRoute>} />
const PrivateRoute = ({ user, catalogue, children }) =>
  auth.canViewDataset(catalogue, user) ? (
    children
  ) : (
    <Layout openKeys={[]} selectedKeys={[]}>
      <Exception403 />
    </Layout>
  );

const mapContextToProps = ({ user, catalogue, dataset }) => ({
  user,
  catalogue,
  dataset,
});

export default withContext(mapContextToProps)(PrivateRoute);
