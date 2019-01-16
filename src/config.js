const environments = {
    dev: {
      url: 'http://test.col.plus',
      // dataApi: '//api.gbif-dev.org/v1',
      // dataApi: '//api-demo.gbif-dev.org/v1',
      dataApi: 'http://api-dev.col.plus/',
      env: 'dev'
    },
    prod: {
        url: 'http://test.col.plus',
        // dataApi: '//api.gbif-dev.org/v1',
        // dataApi: '//api-demo.gbif-dev.org/v1',
        dataApi: 'http://api.col.plus/',
        env: 'dev'
      }
  };
  
  
  let env = environments.dev;
  
  
  export default env;