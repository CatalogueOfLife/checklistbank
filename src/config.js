const environments = {
  dev: {
    url: "https://data.dev.catalogueoflife.org/",

    dataApi: "https://api.dev.catalogueoflife.org/",
    downloadApi: "http://download.dev.catalogueoflife.org/",
    env: "dev",
    kibanaEnv: {
      name: "col-dev-ws",
      index: "1834aa30-fe43-11ea-93de-b97c40066ce8",
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

    downloadApi: "https://download.catalogue.life/",
    env: "prod",
    kibanaEnv: {
      name: "col-prod-ws",
      index: "463d38b0-fe44-11ea-93de-b97c40066ce8",
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

let env = environments.prod;
if (domain.endsWith("data.catalogue.life")) {
  env = environments.prod;
} else if (domain.endsWith("localhost")) {
  env = environments.dev;
} else {
  env = environments.dev;
}

export default env;
