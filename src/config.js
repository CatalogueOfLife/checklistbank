const environments = {
  dev: {
    url: "https://data.dev.catalogue.life/",

    dataApi: "https://api.dev.catalogue.life/",
    downloadApi: "http://api.dev.catalogue.life/download/",
    env: "dev",
    kibanaEnv: {
      name: "col-dev",
      index: "AWyLa2lBHCKcR6PFXu26",
    },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "COL draft",
      origin: "managed",
    },
    NAME_INDEX: {
      key: 1,
      title: "Name Index",
    },
    gitBackend: "https://github.com/CatalogueOfLife/backend/tree/",
    gitFrontend: "https://github.com/CatalogueOfLife/checklistbank/tree/",
    syncStateHeartbeat: 3000,
  },
  prod: {
    url: "https://data.catalogue.life/",
    dataApi: "https://api.catalogue.life/",

    downloadApi: "http://api.catalogue.life/download/",
    env: "prod",
    kibanaEnv: {
      name: "col-prod",
      index: "AWyLa4mQHCKcR6PFXu4X",
    },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "COL draft",
      origin: "managed",
    },
    NAME_INDEX: {
      key: 1,
      title: "Name Index",
    },
    gitBackend: "https://github.com/CatalogueOfLife/backend/tree/",
    gitFrontend: "https://github.com/CatalogueOfLife/checklistbank/tree/",
    syncStateHeartbeat: 3000,
  },
  docker: {
    url: "http://localhost:3000",
    dataApi: "http://localhost:8090/",
    env: "docker",
    kibanaEnv: { name: "col-docker", index: "AWyLa4mQHCKcR6PFXu4X" },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "COL draft",
      origin: "managed",
    },
    NAME_INDEX: {
      key: 1,
      title: "Name Index",
    },
    gitBackend: "https://github.com/CatalogueOfLife/backend/tree/",
    gitFrontend: "https://github.com/CatalogueOfLife/checklistbank/tree/",
    syncStateHeartbeat: 3000,
  },
  local: {
    url: "http://localhost:3000",
    dataApi: "http://localhost:8080/",
    env: "local",
    kibanaEnv: { name: "col-local", index: "AWyLa4mQHCKcR6PFXu4X" },
    MANAGEMENT_CLASSIFICATION: {
      key: 3,
      title: "COL draft",
      origin: "managed",
    },
    NAME_INDEX: {
      key: 1,
      title: "Name Index",
    },
    gitBackend: "https://github.com/CatalogueOfLife/backend/tree/",
    gitFrontend: "https://github.com/CatalogueOfLife/checklistbank/tree/",
    syncStateHeartbeat: 3000,
  },
};

const domain = window.location.hostname;

let env = environments.dev;
if (domain.endsWith("data.catalogue.life")) {
  env = environments.prod;
} else if (domain.endsWith("dev.catalogue.life")) {
  env = environments.dev;
} else if (domain.endsWith("catalogue.life")) {
  env = environments.prod;
} else if (domain.endsWith("localhost")) {
  // env = environments.local;
}

export default env;
