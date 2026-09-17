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
      (roles &&
      (roles.includes("admin") || roles.includes("editor"))) ||
      (editor  && editor.includes(Number(dataset.key)))
    );
  },
  // Editors are listed by project key, never by release key - the backend
  // evaluates a release through the project it was released from. Use this
  // wherever edit rights on a release are meant.
  canEditProjectOf: (dataset, user) => {
    if (!user || !dataset) {
      return false;
    }
    const { roles, editor } = user;
    const key = dataset.sourceKey ?? dataset.key;
    return (
      (roles && (roles.includes("admin") || roles.includes("editor"))) ||
      (editor && editor.includes(Number(key)))
    );
  },
  canViewDataset: (dataset, user) => {
    if (!user || !dataset) {
      return false;
    }
    const { roles, editor, reviewer } = user;
    return (
      // if any role is present, the user can view a dataset
      (roles && roles.length > 0) ||
      (editor && editor.includes(Number(dataset.key))) ||
      (reviewer && reviewer.includes(Number(dataset.key)))
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
