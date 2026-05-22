import React from "react";
import Exception from "./Exception";
import { Link } from "react-router-dom";

const Exception403 = (props) => (
  <Exception
    type="403"
    // desc="Sorry, you do not have access to this page, or you may not be logged in?"
    linkElement={Link}
    backText="Back to dashboard"
  />
);

export default Exception403;
