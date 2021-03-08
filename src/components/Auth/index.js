const Auth = {
  isAuthorised: (user, roles) => {
    if (!roles && user) {
      return true;
    }

    if (user && user.roles && roles.some((r) => user.roles.includes(r))) {
      return true;
    }

    return false;
  },
  canEditDataset: (dataset, user) => {
    if (!user) {
      return false;
    }
    const { roles, datasets } = user;
    return (
      roles &&
      dataset &&
      (roles.includes("admin") ||
        (datasets &&
          roles.includes("editor") &&
          datasets.includes(dataset.key)))
    );
  },
  isEditorOrAdmin: (user) => {
    if (!user) {
      return false;
    }
    const { roles } = user;
    return roles && (roles.includes("admin") || roles.includes("editor"));
  },
};

export default Auth;
