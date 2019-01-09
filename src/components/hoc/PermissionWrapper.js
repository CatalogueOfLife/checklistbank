import React from 'react';
import PropTypes from 'prop-types';

import withContext from './withContext';

/**
 * Wrapper to check if the current user can have access to wrapped controls or not
 * @param user - active user (from App Context)
 * @param roles - array of required roles
 * @param uid - array of UIDs to check permissions to create/edit item or subtypes
 * @param createType - type of item to create
 * @param children - wrapped content, usually controls
 * @returns {*}
 * @constructor
 */
const PermissionWrapper = ({ user, roles, children }) => {
 
  const isAuthorised = (user, roles) => {
    if (!roles && user) {
      return true;
    }

    if (user && roles.some(r=> user.roles.includes(r))) {
     return true;
   }
    
    return false;
  };

  

  if (isAuthorised(user, roles)) {
    return (
      <React.Fragment>
        {children}
      </React.Fragment>
    );
  }

  return null;
};

PermissionWrapper.propTypes = {
  roles: PropTypes.array.isRequired,
//  uuids: PropTypes.array.isRequired,
 // createType: PropTypes.string
};

const mapContextToProps = ({ user }) => ({ user });

export default withContext(mapContextToProps)(PermissionWrapper);