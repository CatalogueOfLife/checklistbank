import { useEffect } from "react";
import withRouter from "../../withRouter";
import _ from "lodash";

import withContext from "../hoc/withContext";

const ExceptionHandler = ({ location, clearError, error }) => {
  useEffect(() => {
    if ([401, 403].includes(_.get(error, "response.status"))) {
      clearError();
    }
    // Fires when location.pathname changes; the original componentDidUpdate
    // checked prevProps.error so it would clear once after navigating away
    // from a 401/403 page. Reading current `error` here is close enough:
    // by the time the path actually changes, the in-flight error is still
    // the one we want to clear.
  }, [location.pathname]);
  return null;
};

const mapContextToProps = ({ addError, clearError, error }) => ({
  addError,
  clearError,
  error,
});

export default withContext(mapContextToProps)(withRouter(ExceptionHandler));
