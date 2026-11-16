import { useState, useEffect } from "react";
import withRouter from "../../../withRouter";
import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import _ from "lodash";
import qs from "query-string";

import { Row, Alert, Switch, Button, Tabs, Flex, App } from "antd";

import axios from "axios";
import ErrorMsg from "../../../components/ErrorMsg";
import PresentationItem from "../../../components/PresentationItem";
import BooleanValue from "../../../components/BooleanValue";
import DatasetSettingsForm from "../../../components/DatasetSettingsForm";
import DeleteOrphansButton from "../../project/Options/DeleteOrphansButton";
import ImportButton from "../../../components/job/ImportButton";
import DeleteDatasetButton from "./DeleteDatasetButton";
import GbifRegistration from "./GbifRegistration";
import SectionCard from "./SectionCard";

// the GBIF tab shows these settings
const GBIF_SETTINGS = ["gbif sync lock"];
// the settings tab shows these sections in this order, each with its settings in the given order.
// A section only shows the settings for the origin of the dataset and is left out if there are none.
// All other settings are in a last section "Other".
const SECTIONS = [
  {
    title: "Import settings",
    names: [
      "data access",
      "data format",
      "import frequency",
      "csv delimiter",
      "csv quote",
      "csv quote escape",
      "add identifiers from",
      "rematch decisions",
    ],
  },
  {
    title: "Metadata",
    names: ["lock metadata", "merge metadata"],
  },
  {
    title: "Defaults",
    names: ["distribution gazetteer", "nomenclatural code", "extinct", "environment"],
  },
  {
    title: "Interpretation",
    names: ["epithet add hyphen", "prefer name atoms", "dont infer ranks", "doi resolution"],
  },
  {
    title: "Sync",
    names: ["sync scheduler", "sync scheduler sources", "block merge syncs"],
  },
  {
    title: "Release",
    names: ["release config", "xrelease config", "source max container authors"],
  },
];

const settingValue = (value) =>
  value === true || value === false ? (
    <BooleanValue value={value} />
  ) : value === "\t" ? (
    "<TAB>"
  ) : _.isArray(value) ? (
    value.join(", ")
  ) : (
    value
  );

/**
 * Shows some of the dataset settings and edits them in place.
 * Without a fixed order the boolean settings come first.
 */
const SettingsPanel = ({ title, settings, data, datasetKey, dataset, ordered, onSaved }) => {
  const [editMode, setEditMode] = useState(false);
  if (!data || settings.length === 0) {
    return null;
  }
  const names = settings.map((s) => s.name);
  const shown = ordered
    ? settings
    : _.sortBy(settings, (s) => (s.type === "Boolean" ? 0 : 1));
  return (
    <SectionCard
      title={title}
      extra={
        <Switch
          checked={editMode}
          onChange={setEditMode}
          checkedChildren="Cancel"
          unCheckedChildren="Edit"
        />
      }
    >
      {editMode ? (
        <DatasetSettingsForm
          data={data}
          datasetKey={datasetKey}
          dataset={dataset}
          filter={(s) => names.includes(s.name)}
          order={ordered ? names : undefined}
          onSaveSuccess={() => {
            setEditMode(false);
            onSaved();
          }}
        />
      ) : (
        shown.map((s) => (
          <PresentationItem label={_.startCase(s.name)} helpText={s.description} key={s.name}>
            {settingValue(_.get(data, s.name))}
          </PresentationItem>
        ))
      )}
    </SectionCard>
  );
};

const DatasetOptions = ({ datasetKey, datasetSettings, dataset, location, history }) => {
  const { notification } = App.useApp();
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [rebuildMatcherLoading, setRebuildMatcherLoading] = useState(false);

  const getData = () => {
    axios(`${config.dataApi}dataset/${datasetKey}/settings`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setData(null);
      });
  };

  useEffect(() => {
    getData();
  }, [datasetKey]);

  const reindexDataset = () => {
    axios
      .post(`${config.dataApi}admin/reindex?datasetKey=${datasetKey}`)
      .then(() => {
        setError(null);
        notification.open({
          title: "Process started",
          description: `Dataset ${datasetKey} is being reindexed`,
        });
      })
      .catch((err) => setError(err));
  };

  const rebuildMatcher = () => {
    setRebuildMatcherLoading(true);
    setError(null);
    axios
      .delete(`${config.dataApi}matcher/${datasetKey}`)
      .then(() => axios.post(`${config.dataApi}matcher/${datasetKey}`))
      .then(() => {
        setRebuildMatcherLoading(false);
        notification.open({
          title: "Matcher rebuild started",
          description: `Matcher index for dataset ${datasetKey} is being rebuilt`,
        });
      })
      .catch((err) => {
        setRebuildMatcherLoading(false);
        setError(err);
      });
  };

  if (!dataset) {
    return null;
  }

  const importable = dataset.origin === "external";
  const originSettings = datasetSettings.filter(
    (s) => _.get(s, "origin", ["project", "external"]).indexOf(dataset.origin) > -1
  );
  const pick = (names) =>
    names
      .map((n) => originSettings.find((s) => s.name === n))
      .filter(Boolean);
  const gbifSettings = pick(GBIF_SETTINGS);
  const sections = SECTIONS.map((sec) => ({ title: sec.title, settings: pick(sec.names) }));
  const grouped = [gbifSettings, ...sections.map((sec) => sec.settings)];
  const otherSettings = originSettings.filter(
    (s) => !grouped.some((group) => group.includes(s))
  );
  const panelProps = { data, datasetKey, dataset, onSaved: getData };

  const tabs = [
    {
      key: "settings",
      label: "Settings",
      children: (
        <Flex vertical gap="middle">
          {importable && (
            <div>
              <ImportButton
                record={{ datasetKey: dataset.key }}
                reImport={data && !data["data access"]}
              />
            </div>
          )}
          {sections.map((sec) => (
            <SettingsPanel
              key={sec.title}
              title={sec.title}
              settings={sec.settings}
              ordered
              {...panelProps}
            />
          ))}
          <SettingsPanel title="Other" settings={otherSettings} {...panelProps} />
        </Flex>
      ),
    },
    {
      key: "gbif",
      label: "GBIF",
      children: (
        <Flex vertical gap="middle">
          <GbifRegistration datasetKey={datasetKey} />
          <SettingsPanel title="GBIF settings" settings={gbifSettings} ordered {...panelProps} />
        </Flex>
      ),
    },
    {
      key: "admin",
      label: "Admin",
      children: (
        <Flex vertical gap="small" align="flex-start">
          <Button type="primary" onClick={reindexDataset}>
            Reindex dataset
          </Button>
          <Button type="primary" onClick={rebuildMatcher} loading={rebuildMatcherLoading}>
            Rebuild matcher
          </Button>
          <DeleteOrphansButton datasetKey={datasetKey} type="name" />
          <DeleteOrphansButton datasetKey={datasetKey} type="reference" />
          {!dataset.deleted && <DeleteDatasetButton record={dataset} />}
        </Flex>
      ),
    },
  ];

  const params = qs.parse(location?.search);
  // the first tab unless the URL names another
  const activeKey = tabs.some((t) => t.key === params.tab) ? params.tab : tabs[0].key;
  const onTabChange = (tab) =>
    history.replace({
      pathname: location.pathname,
      search: qs.stringify({ ...params, tab }),
    });

  return (
    <PageContent>
      {error && (
        <Row style={{ marginBottom: "10px" }}>
          <Alert
            closable={{ onClose: () => setError(null) }}
            description={<ErrorMsg error={error} />}
            type="error"
          />
        </Row>
      )}
      <Tabs activeKey={activeKey} onChange={onTabChange} items={tabs} />
    </PageContent>
  );
};

const mapContextToProps = ({ datasetSettings, dataset }) => ({
  datasetSettings,
  dataset,
});
export default withContext(mapContextToProps)(withRouter(DatasetOptions));
