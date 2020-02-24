import React from "react";
import getDeep from "lodash/get";
import config from "../../config"
// APIs
//import localeApi, { LOCALE_STORAGE_NAME } from '../../api/locale';
import {
  whoAmI,
  authenticate as logUserIn,
  logout as logUserOut,
  JWT_STORAGE_NAME
} from "../../api/user";
import {
  getFrequency,
  getDatasetType,
  getDataFormatType,
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
  getLifezones,
  getSectorImportState,
  getCountries,
  getEstimateType,
  getDatasetSettings,
  getGazetteer,
  getEntitytype
} from "../../api/enumeration";
import { getTerms, getTermsOrder } from "../../api/terms";

const {MANAGEMENT_CLASSIFICATION} = config;
// Helpers
// import { getUserItems } from '../helpers';

// Initializing and exporting AppContext - common for whole application
export const AppContext = React.createContext({});

/**
 * This is a State of application
 *
 * Here you can find:
 * - countries: a list of countries CODES requested from /enumeration/basic/Country
 * - userTypes: a list of user types to create a new Contact requested from /enumeration/basic/ContactType
 * - licenses: a list of licenses requested from /enumeration/license
 * - languages: a list of languages CODES requested from /enumeration/basic/Language
 * - installationTypes: a list of installation types requested from /enumeration/basic/InstallationType
 * - user: active user requested after login or whoAmI requests
 * - notifications: success/info/error messages from all over the app to provide them later for Notification component
 * - locale: current localization key:value pairs requested from the JSON files located in a public folder
 * - syncInstallationTypes: list of types of installation for which user can invoke Synchronization
 */

const ISSUE_COLOR = { warning: "orange", error: "red", info: "green" };
const ISSUE_ORDER = {  error: 1, warning: 2, info: 3 };
const TAXONOMIC_STATUS_COLOR = {"accepted" : "green", "provisionally accepted" : "gold", "synonym": "orange", "ambiguous synonym": "orange", "misapplied": "red"  }

class ContextProvider extends React.Component {
  
  state = {
    catalogueKey: MANAGEMENT_CLASSIFICATION.key,  //TODO Load from localStorage if changed by user
    frequency: [],
    datasetType: [],
    dataFormatType: [],
    datasetOrigin: [],
    issue: [],
    rank: [],
    taxonomicstatus: [],
    nomstatus: [],
    nametype: [],
    namefield: [],
    license: [],
    nomCode: [],
    importState: [],
    user: null,
    notifications: [],
    terms: [],
    lifezone: [],
    sectorImportState: [],
    country: [],
    countryAlpha3: {},
    countryAlpha2: {},
    termsMap: {},
    dataset: null,
    recentDatasets: [],
    estimateType: [],
    datasetSettings: [],
    gazetteer: [],
    entitytype: [],
    catalogue: MANAGEMENT_CLASSIFICATION,
    setCatalogueKey: catalogueKey => {
      this.setState({catalogueKey});
    },
    setCatalogue: catalogue => this.setState({catalogue, catalogueKey: catalogue.key }),
    setDataset: dataset => {
      this.setState({ dataset });
    },
    setRecentDatasets: recentDatasets => {
      this.setState({ recentDatasets });
    },
    // locale: { loading: true },
    // Adding errors to the list to provide them later for displaying
    addError: ({ status = 500, statusText = "An error occurred" } = {}) => {
      this.setState(state => {
        return {
          notifications: [
            ...state.notifications,
            { type: "error", status, statusText }
          ]
        };
      });
    },
    // Adding success messages to the list to provide them later for displaying
    addSuccess: ({ status = 200, statusText = "Response successful" } = {}) => {
      this.setState(state => {
        return {
          notifications: [
            ...state.notifications,
            { type: "success", status, statusText }
          ]
        };
      });
    },
    // Adding info messages to the list to provide them later for displaying
    addInfo: ({ status = 200, statusText = "Response successful" } = {}) => {
      this.setState(state => {
        return {
          notifications: [
            ...state.notifications,
            { type: "info", status, statusText }
          ]
        };
      });
    },
    clearNotifications: () => {
      this.setState({ notifications: [] });
    },

    login: values => {
      return this.login(values);
    },
    logout: () => {
      this.logout();
    },
    getDuplicateWarningColor: count => {
      if(Number(count) === 0){
        return ISSUE_COLOR.info
      } else if(Number(count) < 51) {
        return ISSUE_COLOR.warning
      } else if(Number(count) > 50) {
        return ISSUE_COLOR.error
      }
    },
    getTaxonomicStatusColor: status => TAXONOMIC_STATUS_COLOR[status]
  };

  componentDidMount() {
    // Requesting user by token to restore active session on App load
    // if a user was authenticated
    this.loadTokenUser();
    // Requesting common dictionaries
    Promise.all([
      getFrequency(),
      getDatasetType(),
      getDataFormatType(),
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
      getLifezones(),
      getSectorImportState(),
      getCountries(),
      getEstimateType(),
      getDatasetSettings(),
      getGazetteer(),
      getEntitytype()
    ]).then(responses => {
      const issueMap = {};
      responses[6].forEach(i => {
        issueMap[i.name] = {
          group: i.group,
          level: i.level,
          color: ISSUE_COLOR[i.level],
          description: i.description
        };
      });
      const termsMapReversed = {};
      const termsMap = responses[10];
      Object.keys(termsMap).forEach(t => {
        termsMap[t].forEach(j => {
          if (!termsMapReversed[j]) {
            termsMapReversed[j] = [t];
          } else {
            termsMapReversed[j] = [...termsMapReversed[j], t];
          }
        });
      });
      const countryAlpha3 = {};
      const countryAlpha2 = {};
      responses[17].forEach(c => {
        countryAlpha3[c.alpha3] = c;
        countryAlpha2[c.alpha2] = c;
      });

      const recentDatasetsAsText = localStorage.getItem('colplus_recent_datasets');
      const recentDatasets = recentDatasetsAsText ? JSON.parse(recentDatasetsAsText) : [];

      this.setState({
        frequency: responses[0],
        datasetType: responses[1],
        dataFormatType: responses[2],
        datasetOrigin: responses[3],
        rank: responses[4],
        taxonomicstatus: responses[5],
        issue: responses[6].sort((a, b) => (ISSUE_ORDER[a.level] - ISSUE_ORDER[b.level])), // Order by severity
        issueMap: issueMap,
        nomstatus: responses[7],
        nametype: responses[8],
        namefield: responses[9],
        license: responses[11],
        nomCode: responses[12],
        importState: responses[13],
        terms: responses[14],
        lifezone: responses[15],
        sectorImportState: responses[16],
        country: responses[17],
        estimateType: responses[18],
        datasetSettings: responses[19],
        gazetteer: responses[20],
        entitytype: responses[21],
        countryAlpha3: countryAlpha3,
        countryAlpha2: countryAlpha2,
        termsMap: termsMap,
        termsMapReversed: termsMapReversed,
        recentDatasets
      });
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
    return logUserIn(username, password, remember).then(user => {
      const jwt = user.token;
      sessionStorage.setItem(JWT_STORAGE_NAME, jwt);
      if (remember) {
        localStorage.setItem(JWT_STORAGE_NAME, jwt);
      }
      this.setState({ user: { ...user, editorRoleScopeItems: [] } });
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
        .then(res => {
          this.setState({ user: { ...res.data, editorRoleScopeItems: [] } });
          // this.getUserItems(res.data);
        })
        .catch(err => {
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

  /**
   * Requesting user items by keys from editorRoleScopes list
   * @param editorRoleScopes - list of UIDs which indicates users scope
   */
  /*
  getUserItems = ({ editorRoleScopes }) => {
    getUserItems(editorRoleScopes).then(response => {
      this.setState(state => {
        return {
          user: {
            ...state.user,
            editorRoleScopeItems: response
          }
        }
      });
    });
  };

  */
  render() {
    return (
      <AppContext.Provider value={this.state}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}

export default ContextProvider;
