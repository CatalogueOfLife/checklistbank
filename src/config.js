import environments from "./env.json";

const domain = window.location.hostname;

let env = environments.dev;
if (domain.endsWith("data.catalogue.life")) {
  env = environments.prod;
} else if (domain.endsWith("localhost")) {
  env = environments.dev;
} else {
  env = environments.dev;
}

export default env;
