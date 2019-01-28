import React, { Component } from "react";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import PrivateRoute from "./components/Auth/PrivateRoute";

import history from "./history";
import "./App.css";
import DatasetList from "./pages/DatasetList";
import DatasetPage from "./pages/DatasetKey";
import DatasetCreate from "./pages/DatasetCreate";
import Taxon from "./pages/Taxon";
import Name from "./pages/Name";
import VerbatimRecord from "./pages/VerbatimRecord"
import { ThemeProvider } from "react-jss";

import Assembly from "./pages/Assembly";

import Imports from "./pages/Imports";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import Helmet from "react-helmet";
const theme = {
  colorPrimary: "deepskyblue"
};

class App extends Component {
  render() {
    return (
      <ContextProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+</title>
          <link rel="canonical" href="http://test.col.plus" />
        </Helmet>
        <Router history={history}>
          <ThemeProvider theme={theme}>
            <Switch>
              <Route
                exact
                path="/"
                render={props => (
                  <Redirect
                    to={{
                      pathname: "/imports/running"
                    }}
                  />
                )}
              />
              <Route
                exact
                path="/imports/:section?"
                render={({ match }) => (
                  <Imports section={match.params.section} />
                )}
              />
              <PrivateRoute
                exact
                key="Assembly"
                path={`/assembly`}
                roles={["editor"]}
                component={Assembly}
              />
              />
              <Route
                exact
                key="taxonKey"
                path={`/dataset/:key/taxon/:taxonKey`}
                component={Taxon}
              />
              <Route
                exact
                key="nameKey"
                path={`/dataset/:key/name/:nameKey`}
                component={Name}
              />
              <Route
                exact
                key="verbatimKey"
                path={`/dataset/:key/verbatim`}
                component={VerbatimRecord}
              />
              <PrivateRoute
                exact
                key="datasetCreate"
                path={`/dataset/create`}
                roles={["editor", "admin"]}
                component={DatasetCreate}
              />
              />
              <Route
                exact
                key="datasetKey"
                path={`/dataset/:key/:section?`}
                render={({ match, location }) => (
                  <DatasetPage
                    section={match.params.section}
                    datasetKey={match.params.key}
                    location={location}
                  />
                )}
              />
              <Route
                exact
                key="dataset"
                path="/dataset"
                render={props => <DatasetList location={props.location} />}
              />
              <Route component={Exception404} />
            </Switch>
          </ThemeProvider>
        </Router>
      </ContextProvider>
    );
  }
}

export default App;
