const environments = {
  dev: {
    url: "https://dev.col.plus",

    dataApi: "https://api-dev.col.plus/",
    env: "dev",
    kibanaEnv: {
      name: "col-dev-ws",
      index: "AWyLa2lBHCKcR6PFXu26"
    },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "CoL draft"
    },
    NAME_INDEX: {
      key: 2,
      title: "Name Index"
    },
    gitBackend: "https://github.com/Sp2000/colplus-backend/tree/",
    gitFrontend: "https://github.com/Sp2000/colplus-frontend/tree/"
  },
  prod: {
    url: "https://wwww.col.plus",
    dataApi: "https://api.col.plus/",
    env: "prod",
    kibanaEnv: {
      name: "col-prod-ws",
      index: "AWyLa4mQHCKcR6PFXu4X"
    },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "CoL draft"
    },
    NAME_INDEX: {
      key: 2,
      title: "Name Index"
    },
    gitBackend: "https://github.com/Sp2000/colplus-backend/tree/",
    gitFrontend: "https://github.com/Sp2000/colplus-frontend/tree/"
  },
  docker: {
    url: "http://localhost:3000",
    dataApi: "http://localhost:8090/",
    env: "docker",
    kibanaEnv: { name: "col-docker", index: "AWyLa4mQHCKcR6PFXu4X" },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "CoL draft"
    },
    NAME_INDEX: {
      key: 2,
      title: "Name Index"
    },
    gitBackend: "https://github.com/Sp2000/colplus-backend/tree/",
    gitFrontend: "https://github.com/Sp2000/colplus-frontend/tree/"
  },
  local: {
    url: "http://localhost:3000",
    dataApi: "http://localhost:8080/",
    env: "local",
    kibanaEnv: { name: "col-local", index: "AWyLa4mQHCKcR6PFXu4X" },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "CoL draft"
    },
    NAME_INDEX: {
      key: 2,
      title: "Name Index"
    },
    gitBackend: "https://github.com/Sp2000/colplus-backend/tree/",
    gitFrontend: "https://github.com/Sp2000/colplus-frontend/tree/"
  }
};

const domain = window.location.hostname;

let env = environments.dev;
if (domain.endsWith("www.col.plus")) {
  env = environments.prod;
} else if (domain.endsWith("dev.col.plus")) {
  env = environments.dev;
} else if (domain.endsWith('localhost')) {
  // env = environments.local;
}

export default env;
