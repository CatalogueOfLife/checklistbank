import React from "react";
import Exception from "./Exception";
import { Link } from "react-router-dom";

// Previously translated via react-intl, now hard-coded English.
const Exception500 = () => (
  <Exception
    type="500"
    desc="Sorry, the server is reporting an error"
    linkElement={Link}
    backText="Back to dashboard"
  />
);

export default Exception500;
