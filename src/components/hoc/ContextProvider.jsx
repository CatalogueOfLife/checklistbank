import React, { useState, useEffect, useRef } from "react";
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
  getJobStatus,
  getJobPriority,
  getJobLane,
  getCountries,
  getEstimateType,
  getDatasetSettings,
  getGazetteer,
  getEntitytype,
  getDecisionMode,
  getSpeciesinteractiontype,
  getUserRole,
  getNameIndexRank,
  getDoiResolution,
  getInfoGroup,
  getTaxGroup,
  getLanguages,
  getIdentifierScope,
  getSectorAuthorshipUpdate,
} from "../../api/enumeration";
import { getJobQueue as fetchJobQueue } from "../../api/job";
import { getComponentState } from "../../api/admin";
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

const getJsonDatasetForLocalStorage = (dataset) =>
  !!dataset
    ? JSON.stringify({
        key: dataset.key,
        title: dataset.title,
        alias: dataset?.alias || "",
        origin: dataset?.origin || "",
      })
    : null;

const ContextProvider = ({ children }) => {
  const [projectKey, setProjectKey] = useState(
    localStorage.getItem("col_selected_project")
      ? JSON.parse(localStorage.getItem("col_selected_project")).key
      : null
  );
  const [frequency, setFrequency] = useState([]);
  const [datasetType, setDatasetType] = useState([]);
  const [dataFormat, setDataFormat] = useState([]);
  const [datasetOrigin, setDatasetOrigin] = useState([]);
  const [issue, setIssue] = useState([]);
  const [rank, setRank] = useState([]);
  const [nameIndexRank, setNameIndexRank] = useState([]);
  const [taxonomicstatus, setTaxonomicstatus] = useState([]);
  const [nomstatus, setNomstatus] = useState([]);
  const [nomStatusMap, setNomStatusMap] = useState(null);
  const [nametype, setNametype] = useState([]);
  const [namefield, setNamefield] = useState([]);
  const [license, setLicense] = useState([]);
  const [nomCode, setNomCode] = useState([]);
  const [importState, setImportState] = useState([]);
  const [importStateMap, setImportStateMap] = useState({});
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [terms, setTerms] = useState([]);
  const [environment, setEnvironment] = useState([]);
  // JOBSTATUS - the unified lifecycle of every background job.
  // `importState` above is no longer a lifecycle: it is now only the label
  // vocabulary for a running job's free text `step`.
  const [jobStatus, setJobStatus] = useState([]);
  const [jobStatusMap, setJobStatusMap] = useState({});
  const [jobPriority, setJobPriority] = useState([]);
  const [jobLane, setJobLane] = useState([]);
  const [country, setCountry] = useState([]);
  const [decisionMode, setDecisionMode] = useState([]);
  const [userRole, setUserRole] = useState([]);
  const [doiResolution, setDoiResolution] = useState([]);
  const [infoGroup, setInfoGroup] = useState([]);
  const [taxGroup, setTaxGroup] = useState([]);
  const [identifierScope, setIdentifierScope] = useState({});
  const [countryAlpha3, setCountryAlpha3] = useState({});
  const [countryAlpha2, setCountryAlpha2] = useState({});
  const [termsMap, setTermsMap] = useState({});
  const [termsMapReversed, setTermsMapReversed] = useState({});
  const [issueMap, setIssueMap] = useState({});
  const [dataset, setDatasetState] = useState(
    localStorage.getItem("col_selected_dataset") &&
      localStorage.getItem("col_selected_dataset") !== "undefined"
      ? JSON.parse(localStorage.getItem("col_selected_dataset"))
      : null
  );
  const [sourceDataset, setSourceDatasetState] = useState(
    localStorage.getItem("col_selected_source_dataset") &&
      localStorage.getItem("col_selected_source_dataset") !== "undefined"
      ? JSON.parse(localStorage.getItem("col_selected_source_dataset"))
      : null
  );
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [estimateType, setEstimateType] = useState([]);
  const [datasetSettings, setDatasetSettings] = useState([]);
  const [gazetteer, setGazetteer] = useState([]);
  const [entitytype, setEntitytype] = useState([]);
  const [sectorAuthorshipUpdate, setSectorAuthorshipUpdate] = useState([]);
  const [_selectedKeys, setSelectedKeys] = useState([]);
  const [_openKeys, setOpenKeys] = useState([]);
  const [components, setComponents] = useState({});
  const [health, setHealth] = useState({});
  const [background, setBackground] = useState({});
  const [allComponentsRunning, setAllComponentsRunning] = useState(undefined);
  const [allHealthChecksPassing, setAllHealthChecksPassing] = useState(undefined);
  // The live job queue - imports, syncs, releases, exports and everything else
  // now share one executor, so this is a single /job call.
  const [jobQueue, setJobQueue] = useState({
    running: [],
    queued: [],
    queuedCounts: {},
    queuedTotal: 0,
  });
  // The same queue scoped to the currently selected project, so the project
  // menu can badge its running and queued sector syncs.
  const [projectJobQueue, setProjectJobQueue] = useState({
    running: [],
    queued: [],
    queuedCounts: {},
    queuedTotal: 0,
  });
  const [speciesinteractiontype, setSpeciesinteractiontype] = useState([]);
  const [language, setLanguage] = useState([]);
  const [project, setProjectState] = useState(
    localStorage.getItem("col_selected_project")
      ? JSON.parse(localStorage.getItem("col_selected_project"))
      : null
  );

  // Refs to avoid stale closures in async callbacks called from setInterval
  const projectKeyRef = useRef(projectKey);

  useEffect(() => {
    projectKeyRef.current = projectKey;
  }, [projectKey]);

  // Stable callback functions exposed via context
  const addError = (err) => setError(err);
  const clearError = () => setError(null);

  const login = ({ username, password, remember }) => {
    return logUserIn(username, password, remember).then((user) => {
      const jwt = user.token;
      sessionStorage.setItem(JWT_STORAGE_NAME, jwt);
      if (remember) {
        localStorage.setItem(JWT_STORAGE_NAME, jwt);
      }
      setUser({ ...user });
      return user;
    });
  };

  const logout = () => {
    logUserOut();
    setUser(null);
  };

  const loadTokenUser = () => {
    const jwt = sessionStorage.getItem(JWT_STORAGE_NAME);
    if (jwt) {
      whoAmI()
        .then((res) => {
          setUser({ ...res.data });
        })
        .catch((err) => {
          const statusCode = getDeep(err, "response.status", 500);
          if (statusCode < 500) {
            logUserOut();
            setUser(null);
            window.location.reload();
          } else {
            // the axios error, not err.response: ErrorMsg reads message/config off it
            setError(err);
          }
        });
    }
  };

  const setProject = (proj) => {
    if (proj?.key && proj?.title) {
      localStorage.setItem("col_selected_project", JSON.stringify(proj));
      setProjectState(proj);
      setProjectKey(proj.key);
    } else {
      localStorage.removeItem("col_selected_project");
      setProjectState(null);
      setProjectKey(null);
    }
  };

  const setDataset = (ds) => {
    localStorage.setItem(
      "col_selected_dataset",
      getJsonDatasetForLocalStorage(ds)
    );
    setDatasetState(ds);
  };

  const setSourceDataset = (sds) => {
    localStorage.setItem(
      "col_selected_source_dataset",
      getJsonDatasetForLocalStorage(sds)
    );
    setSourceDatasetState(sds);
  };

  const getDuplicateWarningColor = (count) => {
    if (Number(count) === 0) {
      return DUPLICATE_COLOR.info;
    } else if (Number(count) < 51) {
      return DUPLICATE_COLOR.warning;
    } else if (Number(count) > 50) {
      return DUPLICATE_COLOR.error;
    }
  };

  const getTaxonomicStatusColor = (status) => TAXONOMIC_STATUS_COLOR[status];

  const getNomStatusFn = (name) => {
    if (!nomStatusMap) {
      return name.nomStatus;
    } else if (!name.nomStatus) {
      return "";
    } else {
      return nomStatusMap[name.nomStatus] &&
        nomStatusMap[name.nomStatus][name.code]
        ? nomStatusMap[name.nomStatus][name.code]
        : nomStatusMap[name.nomStatus]["zoological"];
    }
  };

  // The live job queue of the selected project. Replaces the old
  // GET dataset/{key}/assembly poll: sector syncs are ordinary background jobs
  // now, so the generic queue answers what the sync state used to.
  // On a transient error the last known state is retained.
  const getProjectJobQueue = async () => {
    const currentProjectKey = projectKeyRef.current;
    if (!currentProjectKey) return;
    try {
      setProjectJobQueue(await fetchJobQueue(currentProjectKey));
    } catch (err) {
      console.log(err);
    }
  };

  const getBackground = async () => {
    try {
      // Stable URL (no per-request cache-buster) so Varnish/Apache can cache
      // and coalesce these polls; freshness is bounded by the Cache-Control
      // max-age set on .status.json (see deploy) and the poll interval.
      const { data: bg } = await axios.get(`${config.downloadApi}.status.json`);
      setBackground(bg);
    } catch (err) {
      console.log(err);
    }
  };

  const getSystemHealth = async () => {
    try {
      const state = await getComponentState();
      // Only components start-all is meant to start count towards the banner: a
      // MANUAL one is off on purpose here, and one disabled for this environment
      // is not reported at all.
      const allRunning = Object.values(state.components).every(
        (c) => !c.autostart || c.running
      );
      setAllComponentsRunning(allRunning);
      setComponents(state.components);
    } catch (err) {
      console.log(err);
    }
    try {
      const { data: h } = await axios.get(
        `${config.dataApi}monitor/healthcheck`,
        {
          // monitor/healthcheck is a public endpoint. Sending the logged-in
          // Authorization header turns this into a CORS preflight that the
          // backend rejects (authorization not in Access-Control-Allow-Headers),
          // so strip the header for this request.
          headers: { Authorization: null },
          // Dropwizard returns 503 (with the full healthcheck body) when any
          // check is unhealthy. Accept it so we can still display which checks
          // are failing instead of blanking the list.
          validateStatus: (status) =>
            status === 503 || (status >= 200 && status < 300),
        }
      );
      if (h && typeof h === "object") {
        const allPassing = Object.keys(h).reduce((a, c) => {
          return a && h[c].healthy;
        }, true);
        setAllHealthChecksPassing(allPassing);
        setHealth(h);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Polls the live job queue. Since the unified job API this is one request:
  // running and queued jobs of every kind, with per lane queue counts.
  // On a transient error the last known state is retained.
  const getJobQueue = async () => {
    try {
      setJobQueue(await fetchJobQueue());
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // Add interceptor to catch auth errors from XHR
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if ([401, 403].includes(_.get(error, "response.status"))) {
          setError(error);
        }
        return Promise.reject(error);
      }
    );
    // Requesting user by token to restore active session on App load
    loadTokenUser();
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
      getJobStatus(),
      getCountries(),
      getEstimateType(),
      getDatasetSettings(),
      getGazetteer(),
      getEntitytype(),
      getDecisionMode(),
      getSpeciesinteractiontype(),
      getUserRole(),
      getNameIndexRank(),
      getDoiResolution(),
      getInfoGroup(),
      getTaxGroup(),
      getLanguages(),
      getIdentifierScope(),
      getSectorAuthorshipUpdate(),
      getJobPriority(),
      getJobLane(),
    ])
      .then((responses) => {
        const newIssueMap = {};
        responses[6].forEach((i) => {
          newIssueMap[i.name] = {
            group: i.group,
            level: i.level,
            color: ISSUE_COLOR[i.level],
            description: i.description,
          };
        });
        const newTermsMapReversed = {};
        const newTermsMap = responses[10];
        Object.keys(newTermsMap).forEach((t) => {
          newTermsMap[t].forEach((j) => {
            if (!newTermsMapReversed[j]) {
              newTermsMapReversed[j] = [t];
            } else {
              newTermsMapReversed[j] = [...newTermsMapReversed[j], t];
            }
          });
        });
        const newCountryAlpha3 = {};
        const newCountryAlpha2 = {};
        responses[17].forEach((c) => {
          newCountryAlpha3[c.alpha3] = c;
          newCountryAlpha2[c.alpha2] = c;
        });
        const newImportStateMap = {};
        responses[13].forEach((i) => (newImportStateMap[i.name] = i));
        const newJobStatusMap = {};
        responses[16].forEach((i) => (newJobStatusMap[i.name] = i));

        const recentDatasetsAsText = localStorage.getItem(
          "colplus_recent_datasets"
        );
        const newRecentDatasets = recentDatasetsAsText
          ? JSON.parse(recentDatasetsAsText)
          : [];

        const newNomStatusMap = responses[7].reduce((a, c) => {
          a[c.name] = c;
          return a;
        }, {});

        setFrequency(responses[0]);
        setDatasetType(responses[1]);
        setDataFormat(responses[2]);
        setDatasetOrigin(responses[3]);
        setRank(responses[4]);
        setTaxonomicstatus(responses[5]);
        setIssue(
          responses[6].sort(
            (a, b) => ISSUE_ORDER[a.level] - ISSUE_ORDER[b.level]
          )
        );
        setIssueMap(newIssueMap);
        setNomstatus(responses[7]);
        setNomStatusMap(newNomStatusMap);
        setNametype(responses[8]);
        setNamefield(responses[9]);
        setLicense(responses[11]);
        setNomCode(responses[12]);
        setImportState(responses[13]);
        setImportStateMap(newImportStateMap);
        setTerms(responses[14]);
        setEnvironment(responses[15]);
        setJobStatus(responses[16]);
        setJobStatusMap(newJobStatusMap);
        setCountry(responses[17]);
        setEstimateType(responses[18]);
        setDatasetSettings(responses[19]);
        setGazetteer(responses[20]);
        setEntitytype(responses[21]);
        setDecisionMode(responses[22]);
        setSpeciesinteractiontype(responses[23]);
        setUserRole(responses[24]);
        setNameIndexRank(responses[25]);
        setDoiResolution(responses[26]);
        setInfoGroup(responses[27]);
        setTaxGroup(responses[28]);
        setLanguage(responses[29]);
        setIdentifierScope(responses[30]);
        setSectorAuthorshipUpdate(responses[31]);
        setJobPriority(responses[32]);
        setJobLane(responses[33]);
        setCountryAlpha3(newCountryAlpha3);
        setCountryAlpha2(newCountryAlpha2);
        setTermsMap(newTermsMap);
        setTermsMapReversed(newTermsMapReversed);
        setRecentDatasets(newRecentDatasets);
      })
      .catch((err) => {
        setError(err);
        console.log(err);
      });
  }, []);

  const contextValue = {
    projectKey,
    frequency,
    datasetType,
    dataFormat,
    datasetOrigin,
    issue,
    rank,
    nameIndexRank,
    taxonomicstatus,
    nomstatus,
    nomStatusMap,
    nametype,
    namefield,
    license,
    nomCode,
    importState,
    importStateMap,
    user,
    notifications,
    error,
    terms,
    environment,
    jobStatus,
    jobStatusMap,
    jobPriority,
    jobLane,
    country,
    decisionMode,
    userRole,
    doiResolution,
    infoGroup,
    taxGroup,
    identifierScope,
    countryAlpha3,
    countryAlpha2,
    termsMap,
    termsMapReversed,
    issueMap,
    dataset,
    sourceDataset,
    recentDatasets,
    estimateType,
    datasetSettings,
    gazetteer,
    entitytype,
    sectorAuthorshipUpdate,
    _selectedKeys,
    _openKeys,
    components,
    health,
    background,
    allComponentsRunning,
    allHealthChecksPassing,
    jobQueue,
    projectJobQueue,
    speciesinteractiontype,
    language,
    project,
    setOpenKeys: (keys) => setOpenKeys(keys),
    setSelectedKeys: (keys) => setSelectedKeys(keys),
    setProject,
    setDataset,
    setSourceDataset,
    setRecentDatasets,
    addError,
    clearError,
    login,
    logout,
    loadTokenUser,
    getDuplicateWarningColor,
    getTaxonomicStatusColor,
    getNomStatus: getNomStatusFn,
    getBackground,
    getSystemHealth,
    getJobQueue,
    getProjectJobQueue,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default ContextProvider;
