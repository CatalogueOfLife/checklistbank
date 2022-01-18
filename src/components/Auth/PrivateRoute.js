import React from "react";
import { Route } from "react-router-dom";
import Exception403 from "../../components/exception/403";

import withContext from "../hoc/withContext";
import Layout from "../LayoutNew";
import auth from "./index.js";

const PrivateRoute = ({
  user,
  roles,
  catalogue,
  component: Component,
  ...rest
}) => (
  <Route
    {...rest}
    render={(props) =>
      auth.canViewDataset(catalogue, user) ? (
        <Component {...props} />
      ) : (
        <Layout openKeys={[]} selectedKeys={[]}>
          <Exception403 />
        </Layout>
      )
    }
  />
);

const mapContextToProps = ({ user, catalogue, dataset }) => ({
  user,
  catalogue,
  dataset,
});

export default withContext(mapContextToProps)(PrivateRoute);
