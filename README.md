[![Build Status](https://builds.gbif.org/job/col-clearinghouse-ui/badge/icon)](https://builds.gbif.org/job/col-clearinghouse-ui/)

# Catalogue of Life — ChecklistBank UI

The Catalogue of Life ChecklistBank is an environment to place taxonomic and nomenclatural information from different sources in different formats into a consistent data model exposed with a rich API.

The UI allows public exploring of all data in ChecklistBank. It is also a tool for assembling taxonomic checklists from multiple sources for authorized users. Source checklists can be imported in several formats and quality checks are applied during import. ChecklistBank includes tools for duplicate detection and allows for editorial decisions to be recorded and applied repeatedly when syncronising data from sources to an assembled checklist.

## Prerequisites

node >= 14

The ChecklistBank UI is build with [React](https://reactjs.org/) using UI components from [Ant design](https://ant.design/).

## Available Scripts

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).
In the project directory, you can run:

### `npm install`

To install the package.json dependencies.

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](#running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!
