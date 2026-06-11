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
  getSectorImportState,
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
  const [sectorImportState, setSectorImportState] = useState([]);
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
  const [_selectedKeys, setSelectedKeys] = useState([]);
  const [_openKeys, setOpenKeys] = useState([]);
  const [syncState, setSyncState] = useState({});
  const [components, setComponents] = useState({});
  const [health, setHealth] = useState({});
  const [syncingSector, setSyncingSector] = useState(null);
  const [syncingDataset, setSyncingDataset] = useState(null);
  const [background, setBackground] = useState({});
  const [allComponentsRunning, setAllComponentsRunning] = useState(undefined);
  const [allHealthChecksPassing, setAllHealthChecksPassing] = useState(undefined);
  // Active jobs across the (currently separate) import and background-job queues.
  const [jobQueue, setJobQueue] = useState({
    importsRunning: [],
    importsRunningCount: 0,
    importsQueued: 0,
    importsQueuedMine: [],
    jobsRunning: [],
    jobsQueued: 0,
    jobsQueuedMine: [],
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
  const syncStateRef = useRef(syncState);

  useEffect(() => {
    projectKeyRef.current = projectKey;
  }, [projectKey]);

  useEffect(() => {
    syncStateRef.current = syncState;
  }, [syncState]);

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
            setError(err.response);
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

  const getSyncState = async () => {
    const currentProjectKey = projectKeyRef.current;
    if (currentProjectKey) {
      try {
        const { data: newSyncState } = await axios(
          `${config.dataApi}dataset/${currentProjectKey}/assembly`
        );
        if (
          _.get(newSyncState, "running") &&
          _.get(newSyncState, "running.sectorKey") !==
            _.get(syncStateRef.current, "running.sectorKey")
        ) {
          const { data: sector } = await axios(
            `${config.dataApi}dataset/${currentProjectKey}/sector/${_.get(
              newSyncState,
              "running.sectorKey"
            )}`
          );
          const { data: sectorDataset } = await axios(
            `${config.dataApi}dataset/${sector.subjectDatasetKey}`
          );
          setSyncState(newSyncState);
          setSyncingSector(sector);
          setSyncingDataset(sectorDataset);
        } else {
          setSyncState(newSyncState);
        }
      } catch (err) {
        setError(err);
      }
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
      const { data: comps } = await axios.get(
        `${config.dataApi}admin/component`
      );
      const allRunning = Object.keys(comps).reduce((a, c) => {
        return a && comps[c];
      }, true);
      setAllComponentsRunning(allRunning);
      setComponents(comps);
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
          transformRequest: (data, headers) => {
            delete headers.common["Authorization"];
            return data;
          },
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

  // Polls the active state of both queues: imports (still separate) and the
  // general background job queue. Only active/queued counts are kept - no
  // finished/past jobs. On a transient error the last known state is retained.
  const getJobQueue = async () => {
    try {
      const userKey = user?.key;
      const requests = [
        // all running imports, regardless of user (never createdBy-filtered)
        axios.get(`${config.dataApi}importer?running=true&limit=1000`),
        axios.get(`${config.dataApi}importer?state=waiting&limit=0`),
        axios.get(`${config.dataApi}job`),
        // the current user's own queued (waiting) imports - shown with a cancel
        // option on the queue page
        userKey
          ? axios.get(
              `${config.dataApi}importer?state=waiting&createdBy=${userKey}&limit=100`
            )
          : Promise.resolve({ data: { result: [] } }),
      ];
      const [running, waiting, jobs, mineImports] = await Promise.all(requests);

      const importsRunning = running?.data?.result || [];
      const importsRunningCount = running?.data?.total ?? importsRunning.length;
      const importsQueued = waiting?.data?.total || 0;
      const importsQueuedMine = mineImports?.data?.result || [];

      const allJobs = Array.isArray(jobs?.data) ? jobs.data : [];
      const jobsRunning = allJobs.filter(
        (j) => String(j?.status).toLowerCase() === "running"
      );
      // the /job queue only holds non-finished jobs, so anything not running
      // (waiting/blocked) is queued
      const jobsQueuedAll = allJobs.filter(
        (j) => String(j?.status).toLowerCase() !== "running"
      );
      const jobsQueuedMine = userKey
        ? jobsQueuedAll.filter((j) =>
            [j?.userKey, j?.createdBy, j?.user?.key].includes(userKey)
          )
        : [];

      setJobQueue({
        importsRunning,
        importsRunningCount,
        importsQueued,
        importsQueuedMine,
        jobsRunning,
        jobsQueued: jobsQueuedAll.length,
        jobsQueuedMine,
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // Add interceptor to catch auth errors from XHR
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if ([401, 403].includes(_.get(error, "status"))) {
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
      getSectorImportState(),
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
        setSectorImportState(responses[16]);
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
    sectorImportState,
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
    _selectedKeys,
    _openKeys,
    syncState,
    components,
    health,
    syncingSector,
    syncingDataset,
    background,
    allComponentsRunning,
    allHealthChecksPassing,
    jobQueue,
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
    getSyncState,
    getBackground,
    getSystemHealth,
    getJobQueue,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default ContextProvider;
