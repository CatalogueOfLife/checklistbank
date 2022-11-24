const Auth = {
  isAuthorised: (user, roles) => {
    if (!roles && user) {
      return true;
    }
    if (user && user.roles && ( typeof roles === "string" ? user.roles.includes(roles) : roles.some((r) => user.roles.includes(r)) )) {
      return true;
    }

    return false;
  },
  canEditDataset: (dataset, user) => {
    if (!user || !dataset) {
      return false;
    }
    const { roles, editor } = user;
    return (
      roles &&
      (roles.includes("admin") ||
        (editor && roles.includes("editor") && editor.includes(Number(dataset.key))))
    );
  },
  canViewDataset: (dataset, user) => {
    if (!user || !dataset) {
      return false;
    }
    const { roles, editor, reviewer } = user;
    return (
      roles &&
      (roles.includes("admin") ||
        (editor && roles.includes("editor") && editor.includes(Number(dataset.key))) ||
        (reviewer &&
          roles.includes("reviewer") &&
          reviewer.includes(dataset.key)))
    );
  },
  isEditorOrAdmin: (user) => {
    if (!user) {
      return false;
    }
    const { roles } = user;
    return roles && (roles.includes("admin") || roles.includes("editor"));
  },
  isAdmin: (user) => {
    if (!user) {
      return false;
    }
    const { roles } = user;
    return roles && roles.includes("admin");
  },
};

export default Auth;
