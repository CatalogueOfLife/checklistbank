import React, { useState, useEffect } from "react";
import axios from "axios";
import { Row, Col, Alert, Button, Checkbox, Input, Select, Popconfirm, Space, Switch, Typography, App } from "antd";
import { NavLink } from "react-router-dom";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import ErrorMsg from "../../../components/ErrorMsg";
import PresentationItem from "../../../components/PresentationItem";
import PublisherAutocomplete from "../../../components/PublisherAutocomplete";
import Auth from "../../../components/Auth";
import { formatTime } from "../../../dateTime";
import SectionCard from "./SectionCard";

const { Text } = Typography;
const PUBLISHER_AGREEMENT = "https://www.gbif.org/terms/data-publisher";
// the licenses GBIF accepts, as the API serialises them
const OPEN_LICENSES = ["cc0", "cc by", "cc by nc"];

// the title of a GBIF organisation as stored by ChecklistBank, falling back to its key
export const usePublisherTitles = (keys) => {
  const [titles, setTitles] = useState({});
  const joined = keys.filter(Boolean).sort().join(",");
  useEffect(() => {
    joined
      .split(",")
      .filter((k) => k && !titles[k])
      .forEach((k) =>
        axios(`${config.dataApi}publisher/${k}`)
          .then((res) => setTitles((t) => ({ ...t, [k]: res.data?.title || k })))
          .catch(() => setTitles((t) => ({ ...t, [k]: k })))
      );
  }, [joined]);
  return titles;
};

/**
 * The GBIF dataset and publisher keys of a dataset not registered through ChecklistBank,
 * usually set by the GBIF sync. Admins can change them.
 */
const GbifKeys = ({ datasetKey, dataset, setDataset, isAdmin }) => {
  const { notification } = App.useApp();
  const [editMode, setEditMode] = useState(false);
  const [gbifKey, setGbifKey] = useState(null);
  const [gbifPublisherKey, setGbifPublisherKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const titles = usePublisherTitles([dataset?.gbifPublisherKey]);

  const startEdit = (checked) => {
    setEditMode(checked);
    setGbifKey(dataset?.gbifKey || null);
    setGbifPublisherKey(dataset?.gbifPublisherKey || null);
  };

  const save = () => {
    setSaving(true);
    setError(null);
    // the API replaces the whole dataset, so update the current one
    axios(`${config.dataApi}dataset/${datasetKey}`)
      .then((res) =>
        axios.put(`${config.dataApi}dataset/${datasetKey}`, {
          ...res.data,
          gbifKey: gbifKey?.trim() || null,
          gbifPublisherKey: gbifPublisherKey?.trim() || null,
        })
      )
      .then(() => axios(`${config.dataApi}dataset/${datasetKey}`))
      .then((res) => {
        setDataset && setDataset(res.data);
        setEditMode(false);
        notification.open({ title: "GBIF keys updated", description: dataset?.title });
      })
      .catch((err) => setError(err))
      .finally(() => setSaving(false));
  };

  return (
    <SectionCard
      title="GBIF keys"
      extra={
        isAdmin && (
          <Switch checked={editMode} onChange={startEdit} checkedChildren="Cancel" unCheckedChildren="Edit" />
        )
      }
    >
      {error && (
        <Alert
          style={{ marginBottom: "10px" }}
          closable={{ onClose: () => setError(null) }}
          description={<ErrorMsg error={error} />}
          type="error"
        />
      )}
      {editMode ? (
        <>
          <PresentationItem label="GBIF key">
            <Input value={gbifKey} onChange={(e) => setGbifKey(e.target.value)} />
          </PresentationItem>
          <PresentationItem label="GBIF publisher key">
            <Input value={gbifPublisherKey} onChange={(e) => setGbifPublisherKey(e.target.value)} />
          </PresentationItem>
          <PresentationItem label="">
            <Button type="primary" loading={saving} onClick={save}>
              Save
            </Button>
          </PresentationItem>
        </>
      ) : (
        <>
          <PresentationItem label="GBIF key">
            {dataset?.gbifKey && (
              <a href={`${config.gbifUrl}dataset/${dataset.gbifKey}`} target="_blank" rel="noreferrer">
                {dataset.gbifKey}
              </a>
            )}
          </PresentationItem>
          <PresentationItem label="GBIF publisher key">
            {dataset?.gbifPublisherKey && (
              <NavLink to={{ pathname: "/dataset", search: `?gbifPublisherKey=${dataset.gbifPublisherKey}` }}>
                {titles[dataset.gbifPublisherKey] || dataset.gbifPublisherKey}
              </NavLink>
            )}
          </PresentationItem>
        </>
      )}
    </SectionCard>
  );
};

/**
 * Registers an external dataset in GBIF from ChecklistBank and shows its registration.
 * Registering needs the organisation publisher role for the chosen GBIF organisation, admins may use any.
 */
const GbifRegistration = ({ datasetKey, dataset, user, setDataset }) => {
  const { notification } = App.useApp();
  // undefined while loading, null if not registered
  const [status, setStatus] = useState(undefined);
  const [error, setError] = useState(null);
  const [publisherKey, setPublisherKey] = useState(null);
  const [newPublisher, setNewPublisher] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const isAdmin = Auth.isAdmin(user);
  const orgPublisher = user?.orgPublisher || [];
  const titles = usePublisherTitles([...orgPublisher, status?.publisherKey]);

  const getStatus = () => {
    axios(`${config.dataApi}dataset/${datasetKey}/gbif`)
      .then((res) => setStatus(res.data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setStatus(null);
        } else {
          setError(err);
        }
      });
  };

  const call = (request, message) => {
    setBusy(true);
    setError(null);
    return request
      .then(() => {
        notification.open({ title: message, description: dataset?.title });
        getStatus();
      })
      .catch((err) => setError(err))
      .finally(() => setBusy(false));
  };

  const register = () =>
    call(
      axios.post(`${config.dataApi}dataset/${datasetKey}/gbif`, { publisherKey, acceptTerms: accepted }),
      "Dataset registered in GBIF"
    );

  const sync = () =>
    call(axios.post(`${config.dataApi}dataset/${datasetKey}/gbif/sync`), "GBIF update requested");

  const changePublisher = () =>
    call(
      axios.put(`${config.dataApi}dataset/${datasetKey}/gbif/publisher/${newPublisher}`),
      "GBIF organisation changed"
    ).then(() => setNewPublisher(null));

  const deregister = () =>
    call(axios.delete(`${config.dataApi}dataset/${datasetKey}/gbif`), "Dataset deregistered from GBIF");

  const external = dataset?.origin === "external";
  useEffect(() => {
    if (external) {
      getStatus();
    } else {
      setStatus(null);
    }
  }, [datasetKey, external]);

  if (!dataset || status === undefined) {
    return null;
  }

  const license = dataset?.license;
  const problems = [];
  if (dataset?.private) problems.push("the dataset is private");
  if (!OPEN_LICENSES.includes(license)) problems.push("GBIF requires the license CC0, CC BY or CC BY-NC");
  if (dataset?.gbifKey && !status) problems.push(`it is in GBIF already as ${dataset.gbifKey}`);

  return (
    <>
      {!status && <GbifKeys datasetKey={datasetKey} dataset={dataset} setDataset={setDataset} isAdmin={isAdmin} />}
      {(status || external) && (
        <SectionCard title="GBIF registration">
          {error && (
            <Alert
              style={{ marginBottom: "10px" }}
              closable={{ onClose: () => setError(null) }}
              description={<ErrorMsg error={error} />}
              type="error"
            />
          )}
          {status ? (
            <Row>
              <Col span={18}>
                <PresentationItem label="GBIF dataset">
                  <a href={`${config.gbifUrl}dataset/${status.registration.gbifKey}`} target="_blank" rel="noreferrer">
                    {status.registration.gbifKey}
                  </a>
                </PresentationItem>
                <PresentationItem label="Published by">
                  {titles[status.publisherKey] || status.publisherKey}
                </PresentationItem>
                <PresentationItem label="Registered">
                  {formatTime(status.registration.created, "MMMM Do YYYY, h:mm a")}
                </PresentationItem>
                {status.command && (
                  <PresentationItem label="GBIF update">
                    {status.command.status === "FAILED" ? (
                      <Text type="danger">{`Failed: ${status.command.lastError || ""}`}</Text>
                    ) : (
                      <Text type="secondary">{`Pending since ${formatTime(status.command.created, "MMMM Do YYYY, h:mm a")}`}</Text>
                    )}
                  </PresentationItem>
                )}
              </Col>
              {isAdmin && (
                <Col span={6}>
                  <Button type="primary" loading={busy} onClick={sync} style={{ marginBottom: "10px" }}>
                    Update in GBIF
                  </Button>
                  <PublisherAutocomplete
                    autoFocus={false}
                    placeHolder="Move to another organisation"
                    onSelectPublisher={(p) => setNewPublisher(p?.key)}
                    onResetSearch={() => setNewPublisher(null)}
                    style={{ marginBottom: "10px", width: "100%" }}
                  />
                  {newPublisher && (
                    <Button loading={busy} onClick={changePublisher} style={{ marginBottom: "10px" }}>
                      Change organisation
                    </Button>
                  )}
                  <br />
                  <Popconfirm
                    title="Deregister the dataset? This deletes it in GBIF."
                    onConfirm={deregister}
                    okText="Deregister"
                    cancelText="Cancel"
                  >
                    <Button danger loading={busy}>
                      Deregister from GBIF
                    </Button>
                  </Popconfirm>
                </Col>
              )}
            </Row>
          ) : !isAdmin && orgPublisher.length === 0 ? (
            <Text type="secondary">
              You can publish this dataset in GBIF once the ChecklistBank team cleared you to publish for a GBIF
              organisation, which needs that organisation's consent. Please get in touch with us.
            </Text>
          ) : problems.length > 0 ? (
            <Text type="secondary">{`This dataset cannot be registered in GBIF: ${problems.join(", ")}.`}</Text>
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                Publish this dataset in GBIF under a GBIF organisation. GBIF receives its latest original archive and the
                metadata as shown in ChecklistBank, and is updated after every import and metadata change.
              </Text>
              {isAdmin ? (
                <PublisherAutocomplete
                  autoFocus={false}
                  placeHolder="Publishing organisation"
                  onSelectPublisher={(p) => setPublisherKey(p?.key)}
                  onResetSearch={() => setPublisherKey(null)}
                  style={{ width: "50%" }}
                />
              ) : (
                <Select
                  style={{ width: "50%" }}
                  placeholder="Publishing organisation"
                  value={publisherKey}
                  onChange={setPublisherKey}
                  options={orgPublisher.map((k) => ({ value: k, label: titles[k] || k }))}
                />
              )}
              <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)}>
                I accept the{" "}
                <a href={PUBLISHER_AGREEMENT} target="_blank" rel="noreferrer">
                  GBIF data publisher agreement
                </a>{" "}
                for this dataset
              </Checkbox>
              <Button type="primary" loading={busy} disabled={!publisherKey || !accepted} onClick={register}>
                Register in GBIF
              </Button>
            </Space>
          )}
        </SectionCard>
      )}
    </>
  );
};

const mapContextToProps = ({ dataset, user, setDataset }) => ({ dataset, user, setDataset });
export default withContext(mapContextToProps)(GbifRegistration);
