const environments = {
    dev: {
      url: 'http://dev.col.plus',
      // dataApi: '//api.gbif-dev.org/v1',
      // dataApi: '//api-demo.gbif-dev.org/v1',
      dataApi: 'http://api-dev.col.plus/',
      env: 'dev',
      MANAGEMENT_CLASSIFICATION: {
        key: 3,
        title: "CoL draft"
      }
    },
    prod: {
        url: 'http://wwww.col.plus',
        // dataApi: '//api.gbif-dev.org/v1',
        // dataApi: '//api-demo.gbif-dev.org/v1',
        dataApi: 'http://api.col.plus/',
        env: 'prod',
        MANAGEMENT_CLASSIFICATION: {
            key: 3,
            title: "CoL draft"
          }
      }
  };
  
  const domain = window.location.hostname;

let env = environments.dev;
if (domain.endsWith('www.col.plus')) {
  env = environments.prod;
} else if (domain.endsWith('dev.col.plus')) {
  env = environments.dev;
}

  
  
  
  export default env;