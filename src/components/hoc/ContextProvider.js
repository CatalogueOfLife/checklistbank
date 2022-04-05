import React from "react";
import getDeep from "lodash/get";
import config from "../../config";
import _ from "lodash";
import axios from "axios";
// APIs
//import localeApi, { LOCALE_STORAGE_NAME } from '../../api/locale';
import {
  whoAmI,
  authenticate as logUserIn,
  logout as logUserOut,
  JWT_STORAGE_NAME,
} from "../../api/user";
import {
  getFrequency,
  getDatasetType,
  getDataFormat,
  getDatasetOrigin,
  getRank,
  getTaxonomicStatus,
  getIssue,
  getNomStatus,
  getNameType,
  getNameField,
  getLicense,
  getNomCode,
  getImportState,
  getEnvironments,
  getSectorImportState,
  getCountries,
  getEstimateType,
  getDatasetSettings,
  getGazetteer,
  getEntitytype,
  getDecisionMode,
  getSpeciesinteractiontype,
  getUserRole,
  getNameIndexRank
} from "../../api/enumeration";
import { getTerms, getTermsOrder } from "../../api/terms";


// Helpers
// import { getUserItems } from '../helpers';

// Initializing and exporting AppContext - common for whole application
export const AppContext = React.createContext({});

/**
 * This is the Main State of the application
 *
 * Here you can find:
 * - enumerations
 * - global error handling
 * - access to backends health
 * - etc
 */

const ISSUE_COLOR = { warning: "orange", error: "red", info: "green" };
const DUPLICATE_COLOR = { warning: "#FFD700", error: "#f50", info: "#32CD32" };

const ISSUE_ORDER = { error: 1, warning: 2, info: 3 };
const TAXONOMIC_STATUS_COLOR = {
  accepted: "green",
  "provisionally accepted": "gold",
  synonym: "orange",
  "ambiguous synonym": "orange",
  misapplied: "red",
};

class ContextProvider extends React.Component {

  state = {
    catalogueKey: localStorage.getItem("col_selected_project")
      ? JSON.parse(localStorage.getItem("col_selected_project")).key
      : null,
    frequency: [],
    datasetType: [],
    dataFormat: [],
    datasetOrigin: [],
    issue: [],
    rank: [],
    nameIndexRank: [],
    taxonomicstatus: [],
    nomstatus: [],
    nomStatusMap: null,
    nametype: [],
    namefield: [],
    license: [],
    nomCode: [],
    importState: [],
    importStateMap: {},
    user: null,
    notifications: [],
    error: null,
    terms: [],
    environment: [],
    sectorImportState: [],
    country: [],
    decisionMode: [],
    userRole: [],
    countryAlpha3: {},
    countryAlpha2: {},
    termsMap: {},
    dataset: localStorage.getItem("col_selected_dataset")
      ? JSON.parse(localStorage.getItem("col_selected_dataset"))
      : null,
    recentDatasets: [],
    estimateType: [],
    datasetSettings: [],
    gazetteer: [],
    entitytype: [],
    _selectedKeys: [], // Menu
    _openKeys: [], // Menu
    syncState: {},
    syncingSector: null,
    syncingDataset: null,
    background: {},
    setOpenKeys: (_openKeys) => this.setState({ _openKeys }),
    setSelectedKeys: (_selectedKeys) => this.setState({ _selectedKeys }),
    catalogue: localStorage.getItem("col_selected_project")
      ? JSON.parse(localStorage.getItem("col_selected_project"))
      : null,
    setCatalogueKey: (catalogueKey) => {
      this.setState({ catalogueKey });
    },
    setCatalogue: (catalogue) => {
      if(catalogue?.key && catalogue?.title){
        localStorage.setItem("col_selected_project", JSON.stringify(catalogue));
        this.setState({ catalogue, catalogueKey: catalogue.key });
      } else {
        localStorage.removeItem("col_selected_project")
        this.setState({ catalogue: null, catalogueKey: null });
      }
      
    },
    setDataset: (dataset) => {
      localStorage.setItem("col_selected_dataset", JSON.stringify(dataset));
      this.setState({ dataset });
    },
    setRecentDatasets: (recentDatasets) => {
      this.setState({ recentDatasets });
    },
    // locale: { loading: true },
    // Adding errors to the list to provide them later for displaying
    addError: (err) => {
      this.setState({ error: err });
    },
    clearError: () => {
      this.setState({ error: null });
    },

    login: (values) => {
      return this.login(values);
    },
    logout: () => {
      this.logout();
    },
    getDuplicateWarningColor: (count) => {
      if (Number(count) === 0) {
        return DUPLICATE_COLOR.info;
      } else if (Number(count) < 51) {
        return DUPLICATE_COLOR.warning;
      } else if (Number(count) > 50) {
        return DUPLICATE_COLOR.error;
      }
    },
    getTaxonomicStatusColor: (status) => TAXONOMIC_STATUS_COLOR[status],
    getNomStatus: (name) => {
      const {nomStatusMap} = this.state;
      if (!nomStatusMap) {
        return name.nomStatus;
      } else if(!name.nomStatus) {
        return ""
      } else {
        return nomStatusMap[name.nomStatus] &&
          nomStatusMap[name.nomStatus][name.code]
          ? nomStatusMap[name.nomStatus][name.code]
          : nomStatusMap[name.nomStatus]["zoological"];
      }
    },

    getSyncState: () => this.getSyncState(),
    getBackground: () => this.getBackground(),
  };

  componentDidMount() {
    // Add interceptor to catch auth errors from XHR
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if ([401, 403].includes(_.get(error, "status"))) {
          this.setState({ error });
        }
        return Promise.reject(error);
      }
    );
    // Requesting user by token to restore active session on App load
    // if a user was authenticated
    this.loadTokenUser();
    // Requesting common dictionaries
    Promise.all([
      getFrequency(),
      getDatasetType(),
      getDataFormat(),
      getDatasetOrigin(),
      getRank(),
      getTaxonomicStatus(),
      getIssue(),
      getNomStatus(),
      getNameType(),
      getNameField(),
      getTerms(),
      getLicense(),
      getNomCode(),
      getImportState(),
      getTermsOrder(),
      getEnvironments(),
      getSectorImportState(),
      getCountries(),
      getEstimateType(),
      getDatasetSettings(),
      getGazetteer(),
      getEntitytype(),
      getDecisionMode(),
      getSpeciesinteractiontype(),
      getUserRole(),
      getNameIndexRank()
    ])
      .then((responses) => {
        const issueMap = {};
        responses[6].forEach((i) => {
          issueMap[i.name] = {
            group: i.group,
            level: i.level,
            color: ISSUE_COLOR[i.level],
            description: i.description,
          };
        });
        const termsMapReversed = {};
        const termsMap = responses[10];
        Object.keys(termsMap).forEach((t) => {
          termsMap[t].forEach((j) => {
            if (!termsMapReversed[j]) {
              termsMapReversed[j] = [t];
            } else {
              termsMapReversed[j] = [...termsMapReversed[j], t];
            }
          });
        });
        const countryAlpha3 = {};
        const countryAlpha2 = {};
        responses[17].forEach((c) => {
          countryAlpha3[c.alpha3] = c;
          countryAlpha2[c.alpha2] = c;
        });
        const importStateMap = {};

        responses[13].forEach((i) => (importStateMap[i.name] = i));
        const recentDatasetsAsText = localStorage.getItem(
          "colplus_recent_datasets"
        );
        const recentDatasets = recentDatasetsAsText
          ? JSON.parse(recentDatasetsAsText)
          : [];

        const nomStatusMap = responses[7].reduce((a, c) => {
          a[c.name] = c;
          return a;
        }, {});
        this.setState({
          frequency: responses[0],
          datasetType: responses[1],
          dataFormat: responses[2],
          datasetOrigin: responses[3],
          rank: responses[4],
          taxonomicstatus: responses[5],
          issue: responses[6].sort(
            (a, b) => ISSUE_ORDER[a.level] - ISSUE_ORDER[b.level]
          ), // Order by severity
          issueMap: issueMap,
          nomstatus: responses[7],
          nomStatusMap: nomStatusMap,
          nametype: responses[8],
          namefield: responses[9],
          license: responses[11],
          nomCode: responses[12],
          importState: responses[13],
          importStateMap: importStateMap,
          terms: responses[14],
          environment: responses[15],
          sectorImportState: responses[16],
          country: responses[17],
          estimateType: responses[18],
          datasetSettings: responses[19],
          gazetteer: responses[20],
          entitytype: responses[21],
          decisionMode: responses[22],
          speciesinteractiontype: responses[23],
          userRole: responses[24],
          nameIndexRank: responses[25],
          countryAlpha3: countryAlpha3,
          countryAlpha2: countryAlpha2,
          termsMap: termsMap,
          termsMapReversed: termsMapReversed,
          recentDatasets,
        });
      })
      .catch((err) => {
        this.state.addError(err);
        console.log(err);
      });
  }
  /*
  changeLocale = locale => {
    if (locale) {
      this.setState(state => {
        return {
          locale: { ...state.locale, loading: true }
        };
      });
      localStorage.setItem(LOCALE_STORAGE_NAME, locale);
      // Requesting new localization
      localeApi.getMessages(locale)
        .then(res => {
          this.setState({ locale: { locale, messages: res.data, loading: false } });
        })
        .catch(err => {
          this.state.addError(err.response);
        });
    }
  };
  */

  login = ({ username, password, remember }) => {
    return logUserIn(username, password, remember).then((user) => {
      const jwt = user.token;
      sessionStorage.setItem(JWT_STORAGE_NAME, jwt);
      if (remember) {
        localStorage.setItem(JWT_STORAGE_NAME, jwt);
      }
      this.setState({ user: { ...user } });
      return user;
      // this.getUserItems(user);
    });
  };

  logout = () => {
    logUserOut();
    this.setState({ user: null });
  };

  /**
   * Checking if a user is logged in via JWT token
   */
  loadTokenUser = () => {
    const jwt = sessionStorage.getItem(JWT_STORAGE_NAME);
    if (jwt) {
      whoAmI()
        .then((res) => {
          this.setState({ user: { ...res.data } });
          // this.getUserItems(res.data);
        })
        .catch((err) => {
          const statusCode = getDeep(err, "response.status", 500);
          if (statusCode < 500) {
            logUserOut();
            this.setState({ user: null });
            window.location.reload();
          } else {
            this.state.addError(err.response);
          }
        });
    }
  };

  getSyncState = async () => {
    const { catalogueKey } = this.state;
    try {
      const { data: syncState } = await axios(
        `${config.dataApi}dataset/${catalogueKey}/assembly`
      );
      if (
        _.get(syncState, "running") &&
        _.get(syncState, "running.sectorKey") !==
          _.get(this.state, "syncState.running.sectorKey")
      ) {
        const { data: sector } = await axios(
          `${config.dataApi}dataset/${catalogueKey}/sector/${_.get(
            syncState,
            "running.sectorKey"
          )}`
        );
        const { data: sectorDataset } = await axios(
          `${config.dataApi}dataset/${sector.subjectDatasetKey}`
        );
        this.setState({
          syncState,
          syncingSector: sector,
          syncingDataset: sectorDataset,
        });
      } else if (!_.get(syncState, "running")) {
        this.setState({
          syncState,
        });
      } else {
        this.setState({
          syncState,
        });
      }
    } catch (err) {
      this.state.addError(err);
    }
  };

  getBackground = async () => {
    try {
      const { data: background } = await axios(
        `${config.dataApi}admin/settings`
      );
      this.setState({ background });
    } catch (err) {}
  };

  render() {
    return (
      <AppContext.Provider value={this.state}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}

export default ContextProvider;
