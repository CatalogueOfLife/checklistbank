import React from "react";
import { withRouter } from "react-router-dom";
import _ from "lodash";

import withContext from "../hoc/withContext";

class ExceptionHandler extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {}

  componentDidUpdate(prevProps) {
    if (
      this.props.location.pathname !== prevProps.location.pathname &&
      [403, 401].includes(_.get(prevProps, "error.response.status"))
    ) {
      this.props.clearError();
    }
  }
  render = () => null;
}

const mapContextToProps = ({ addError, clearError, error }) => ({
  addError,
  clearError,
  error,
});

export default withContext(mapContextToProps)(withRouter(ExceptionHandler));
