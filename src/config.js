const environments = {
  dev: {
    url: "https://data.dev.catalogue.life/",

    dataApi: "http://api.dev.catalogue.life/",

    downloadApi: "http://api.dev.catalogue.life/download/",
    env: "dev",
    kibanaEnv: {
      name: "col-dev",
      index: "AWyLa2lBHCKcR6PFXu26"
    },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "CoL draft"
    },
    NAME_INDEX: {
      key: 1,
      title: "Name Index"
    },
    gitBackend: "https://github.com/Sp2000/colplus-backend/tree/",
    gitFrontend: "https://github.com/Sp2000/colplus-frontend/tree/"
  },
  prod: {
    url: "https://data.catalogue.life/",
    dataApi: "http://api.catalogue.life/",

    downloadApi: "http://api.catalogue.life/download/",
    env: "prod",
    kibanaEnv: {
      name: "col-prod",
      index: "AWyLa4mQHCKcR6PFXu4X"
    },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "CoL draft"
    },
    NAME_INDEX: {
      key: 1,
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
      key: 1,
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
      key: 1,
      title: "Name Index"
    },
    gitBackend: "https://github.com/Sp2000/colplus-backend/tree/",
    gitFrontend: "https://github.com/Sp2000/colplus-frontend/tree/"
  }
};

const domain = window.location.hostname;

let env = environments.dev;
if (domain.endsWith("data.catalogue.life")) {
  env = environments.prod;
} else if (domain.endsWith("dev.catalogue.life")) {
  env = environments.dev;
} else if (domain.endsWith("catalogue.life")) {
  env = environments.prod;
} else if (domain.endsWith('localhost')) {
 // env = environments.local;
}

export default env;
