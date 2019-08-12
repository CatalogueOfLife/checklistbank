const environments = {
    dev: {
      url: 'https://dev.col.plus',

      dataApi: 'https://api-dev.col.plus/',
      env: 'dev',
      kibanaEnv: 'col-dev',
      MANAGEMENT_CLASSIFICATION: {
        key: 3,
        title: "CoL draft"
      },
      NAME_INDEX: {
        key: 2,
        title: "Name Index"
      }
    },
    prod: {
        url: 'https://wwww.col.plus',
        dataApi: 'https://api.col.plus/',
        env: 'prod',
        kibanaEnv: 'col-prod',
        MANAGEMENT_CLASSIFICATION: {
            key: 3,
            title: "CoL draft"
          },
          NAME_INDEX: {
            key: 2,
            title: "Name Index"
          }
    },
    docker: {
        url: 'http://localhost:3000',
        dataApi: 'http://localhost:8090/',
        env: 'docker',
        kibanaEnv: 'col-docker',
        MANAGEMENT_CLASSIFICATION: {
            key: 3,
            title: "CoL draft"
          },
          NAME_INDEX: {
            key: 2,
            title: "Name Index"
          }
      }
  };
  
  const domain = window.location.hostname;

let env = environments.dev;
if (domain.endsWith('www.col.plus')) {
  env = environments.prod;
} else if (domain.endsWith('dev.col.plus')) {
  env = environments.dev;
} else if (domain.endsWith('localhost')) {
  env = environments.docker;
}

  export default env;