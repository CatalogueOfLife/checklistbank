import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Router 6 removed the `withRouter` HOC. The codebase has ~60 class-component
// call sites that still expect Router-5-shaped `history` / `location` / `match`
// props, so this shim wraps the new hooks and produces compatible objects.
// Migrating individual components to hooks is left for a later cleanup pass.
const makeHistory = (navigate, location) => ({
  push: (to, state) =>
    typeof to === "object"
      ? navigate(to, { state: state ?? to.state })
      : navigate(to, { state }),
  replace: (to, state) =>
    typeof to === "object"
      ? navigate(to, { replace: true, state: state ?? to.state })
      : navigate(to, { replace: true, state }),
  go: (n) => navigate(n),
  goBack: () => navigate(-1),
  goForward: () => navigate(1),
  location,
});

const withRouter = (Component) => {
  const Wrapped = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const history = React.useMemo(
      () => makeHistory(navigate, location),
      [navigate, location]
    );
    const match = React.useMemo(
      () => ({ params, isExact: true, path: location.pathname, url: location.pathname }),
      [params, location.pathname]
    );
    return (
      <Component
        {...props}
        history={history}
        location={location}
        match={match}
        navigate={navigate}
      />
    );
  };
  Wrapped.displayName = `withRouter(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};

export default withRouter;
