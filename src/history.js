// Router 6 manages history internally; this shim preserves the
// `history.push(...)` call style from Router-5-era code by routing through a
// useNavigate reference installed once at app start.

let navigator = null;

export const installNavigator = (navigate) => {
  navigator = navigate;
};

const navigate = (to, options) => {
  if (!navigator) {
    // Most likely cause: a module-level history.push() ran before the React
    // tree mounted. Defer in dev to surface bugs without crashing.
    console.warn(
      "history.push() called before the navigator was installed. Action ignored.",
      { to, options }
    );
    return;
  }
  return navigator(to, options);
};

const toOptions = (to, state) =>
  typeof to === "object" ? { state: state ?? to.state } : { state };

const history = {
  push: (to, state) => navigate(to, toOptions(to, state)),
  replace: (to, state) =>
    navigate(to, { ...toOptions(to, state), replace: true }),
  go: (n) => navigate(n),
  goBack: () => navigate(-1),
  goForward: () => navigate(1),
};

export default history;
