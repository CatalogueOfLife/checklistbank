import environments from "./env.json";

const domain = window.location.hostname;

let env = environments.dev;
if (
  domain.endsWith("data.catalogueoflife.org") ||
  domain.endsWith("www.checklistbank.org")
) {
  env = environments.prod;
} else if (domain.endsWith("coltest-vh.catalogueoflife.org")) {
  env = environments.scrap;
} else if (domain.endsWith("localhost")) {
  env = environments.dev;
} else {
  env = environments.dev;
}

export default env;
