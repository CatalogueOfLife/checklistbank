import environments from "./env.json";

const domain = window.location.hostname;

let env = environments.dev;
if (domain.endsWith("www.checklistbank.org")) {
  env = environments.prod;
} else if (domain.endsWith("localhost")) {
  env = environments.prod;
} else if (domain.endsWith("test.checklistbank.org")) {
  env = environments.test;
} else {
  env = environments.dev;
}

export default env;
