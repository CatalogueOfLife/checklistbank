import React from "react";
import withContext from "../hoc/withContext";
import auth from "./index";
const { canEditDataset, canViewDataset } = auth;
// These components have no logic of their own, but are merely convenience wrappers,
// so auth can be used as Components and without injecting the user yourself.

const mapContextToProps = ({ user }) => ({ user });

/**
 * Wrapper to check if the current user has the desired rights
 * @param dataset - Which dataset to edit
 * @returns {*}
 * @constructor
 */
export const CanEditDataset = withContext(mapContextToProps)(
  ({ dataset, user, children }) => {
    return (
      <React.Fragment>
        {canEditDataset(dataset, user) && children}
      </React.Fragment>
    );
  }
);

/**
 * Wrapper to check if the current user has the desired rights
 * @param dataset - Which dataset to edit
 * @returns {*}
 * @constructor
 */
export const CanViewDataset = withContext(mapContextToProps)(
  ({ dataset, user, children }) => {
    return (
      <React.Fragment>
        {canViewDataset(dataset, user) && children}
      </React.Fragment>
    );
  }
);
