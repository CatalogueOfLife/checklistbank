import { useState } from "react";

import {
  BranchesOutlined,
  CaretRightOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  SyncOutlined,
  NodeCollapseOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import {
  App,
  Tag,
  Button,
  Popover,
  Alert,
  Popconfirm,
  Modal,
  Input,
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import history from "../../../history";
import { stringToColour } from "../../../components/util";
import { ColTreeContext } from "./ColTreeContext";
import ErrorMsg from "../../../components/ErrorMsg";
import StaleNameWarning from "../../../components/StaleNameWarning";
import withContext from "../../../components/hoc/withContext";
import { debounce } from "lodash";
import SectorForm from "./SectorForm";
import PresentationItem from "../../../components/PresentationItem";
import { CanEditDataset } from "../../../components/Auth/hasAccess";
import { JOB_LANE } from "../../../api/job";

const Sector = ({
  taxon,
  user,
  projectKey,
  projectJobQueue,
  getProjectJobQueue,
  decisionCallback,
  reloadSelfAndSiblings,
  onDeleteSector,
  showSourceTaxon,
}) => {
  const { notification } = App.useApp();
  const [popOverVisible, setPopOverVisible] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState(null);
  const [sectorDatasetRanks, setSectorDatasetRanks] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");

  const hidePopover = () => {
    setPopOverVisible(false);
  };

  const handleVisibleChange = (visible) => {
    if (!showEditForm) {
      setPopOverVisible(visible);
      setError(null);
    }
  };

  // Running and queued sector syncs of this project, from the generic job
  // queue - sector syncs are ordinary background jobs now.
  const runningSectorKeys = (projectJobQueue?.running || [])
    .filter((j) => j.lane === JOB_LANE.SYNC)
    .map((j) => j.sectorKey);
  const queuedSectorKeys = (projectJobQueue?.queued || [])
    .filter((j) => j.lane === JOB_LANE.SYNC)
    .map((j) => j.sectorKey);

  const syncSector = (sector) => {
    const idle = runningSectorKeys.length === 0;
    axios
      .post(`${config.dataApi}dataset/${projectKey}/sector/sync`, {
        sectorKey: sector.id,
        key: sector.id,
        target: sector.target,
        subject: sector?.subject,
      })
      .then(() => {
        // If there is no sync jobs running, try to give the backend a chance to insert the root node again
        debounce(reloadSelfAndSiblings, 1500)();
        // reloadSelfAndSiblings();
        getProjectJobQueue();
        notification.open({
          title: idle ? "Sync started" : "Sync queued",
          description: idle
            ? `Copying taxa from ${sector.id}`
            : `Awaiting ${runningSectorKeys.length} running and ${queuedSectorKeys.length} queued syncs`,
        });
      })
      .catch((err) => {
        setError(err);
      });
  };

  const deleteSector = (sector, partial = false) => {
    axios
      .delete(
        `${config.dataApi}dataset/${projectKey}/sector/${sector.id}?partial=${partial}`
      ) // /assembly/3/sync/
      .then(() => {
        debounce(onDeleteSector, 500)();
        notification.open({
          title: "Deletion triggered",
          description: `${partial ? "Partial" : "Full"} delete job for ${
            sector.id
          } placed on the sync queue`,
        });
      })
      .catch((err) => {
        setError(err);
      });
  };

  const getSectorDatasetRanks = () => {
    const { sector } = taxon;
    axios
      .get(
        `${config.dataApi}dataset/${sector.subjectDatasetKey}/nameusage/search?facet=rank&limit=0`
      ) // /assembly/3/sync/
      .then((res) => {
        setSectorDatasetRanks(
          _.get(res, "data.facets.rank", []).map((r) => r.value)
        );
      })
      .catch((err) => {
        setError(err);
      });
  };

  const finishEditForm = () => {
    getSectorDatasetRanks();
    setShowEditForm(false);
  };

  const { sector } = taxon;
  const { dataset: sectorSourceDataset } = sector;
  const isPlaceHolder = taxon.id.indexOf("--incertae-sedis--") > -1;
  const isRootSector =
    (!_.get(taxon, "parentId") && !isPlaceHolder) ||
    _.get(taxon, "sectorRoot") === true ||
    (_.get(sector, "target.id") &&
      sector.target &&
      taxon.parentId === sector.target.id);

  const isRootSectorInSourceTree = taxon.id === sector?.subject?.id;
  const isSourceTree = projectKey !== _.get(taxon, "datasetKey");

  if (!sectorSourceDataset) {
    return "";
  }
  return !isSourceTree ? (
    <>
      <Modal
        title="Edit sector"
        open={isRootSector && showEditForm}
        // onOk={finishEditForm}
        onCancel={() => setShowEditForm(false)}
        style={{ top: 150, marginRight: 20 }}
        destroyOnHidden={true}
        mask={{ closable: false }}
        footer={null}
      >
        <SectorForm
          sector={sector}
          onSubmit={(updatedSector) => {
            setShowEditForm(false);
            reloadSelfAndSiblings();
          }}
        />
      </Modal>
      <Popover
        zIndex={999}
        content={
          <div>
            {isRootSector && sector?.subject?.broken === true && (
              <Alert
                style={{ marginBottom: "8px" }}
                title="The sector subject is broken"
                type="warning"
                showIcon
              />
            )}
            {isRootSector && sector?.subject?.stale === true && (
              <Alert
                style={{ marginBottom: "8px" }}
                title={`The sector subject id no longer holds ${sector?.subject?.name} - rematch the sector`}
                type="warning"
                showIcon
              />
            )}
            {isRootSector && sector?.target?.stale === true && (
              <Alert
                style={{ marginBottom: "8px" }}
                title={`The sector target id no longer holds ${sector?.target?.name} - rematch the sector`}
                type="warning"
                showIcon
              />
            )}
            {isRootSector && (
              <>
                <CanEditDataset dataset={{ key: projectKey }}>
                  <Popconfirm
                    title={
                      <p style={{ width: "350px" }}>
                        Do you want a full deletion or a partial deletion? A
                        partial deletion will delete the sector mapping and
                        all species, but keep the higher classification above
                        species
                      </p>
                    }
                    onConfirm={() => {
                      deleteSector(sector, false);
                    }}
                    onCancel={() => {
                      deleteSector(sector, true);
                    }}
                    okText="Full"
                    cancelText="Partial"
                  >
                    <Button style={{ width: "100%" }} type="primary" danger>
                      Delete sector
                    </Button>
                  </Popconfirm>
                  <br />

                  {!runningSectorKeys.includes(sector.id) && (
                    <>
                      <Button
                        style={{ marginTop: "8px", width: "100%" }}
                        type="primary"
                        onClick={() => {
                          syncSector(sector);
                        }}
                      >
                        Sync sector
                      </Button>{" "}
                      <br />
                    </>
                  )}
                </CanEditDataset>
              </>
            )}
            <Button
              style={{ marginTop: "8px", width: "100%" }}
              type="primary"
              onClick={() => {
                history.push(
                  `/project/${projectKey}/sector?key=${sector.id}`
                );
              }}
            >
              Show sector
            </Button>
            <br />
            <Button
              style={{ marginTop: "8px", width: "100%" }}
              type="primary"
              onClick={() =>
                showSourceTaxon(
                  taxon /* sector, sectorSourceDataset */
                )
              }
            >
              Show source taxon
            </Button>
            <br />
            <Button
              style={{ marginTop: "8px", width: "100%" }}
              type="primary"
              onClick={() => {
                history.push(`dataset/${sectorSourceDataset.key}/metadata`);
              }}
            >
              Source Dataset Metadata
            </Button>

            {isRootSector && (
              <CanEditDataset dataset={{ key: projectKey }}>
                <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  disabled={showEditForm}
                  onClick={() => {
                    getSectorDatasetRanks();
                    setShowEditForm(true);
                  }}
                >
                  Edit sector
                </Button>
              </CanEditDataset>
            )}

            {isRootSector && !showEditForm && (
              <>
                {sector.code && (
                  <PresentationItem label="Nom. code">
                    {sector.code}
                  </PresentationItem>
                )}
                {_.get(sector, "ranks[0]") && (
                  <PresentationItem label="Ranks">
                    {sector.ranks.join(", ")}
                  </PresentationItem>
                )}
                {_.get(sector, "entities[0]") && (
                  <PresentationItem label="Entities">
                    {sector.entities.join(", ")}
                  </PresentationItem>
                )}
                {_.get(sector, "note") && (
                  <PresentationItem label="Note">
                    {sector.note}
                  </PresentationItem>
                )}
              </>
            )}
            {error && (
              <Alert
                closable={{ onClose: () => setError(null) }}
                title={
                  <ErrorMsg error={error} style={{ marginTop: "8px" }} />
                }
                type="error"
              />
            )}
          </div>
        }
        title={
          <>
            Sector {sector.id} mode:{" "}
            {sector.mode === "attach" && <CaretRightOutlined />}
            {sector.mode === "union" && (
              <BranchesOutlined
                rotate={90}
                style={{ fontSize: "16px", marginRight: "4px" }}
              />
            )}
            {sector.mode === "merge" && <NodeCollapseOutlined />}{" "}
            {sector.mode}
          </>
        }
        open={popOverVisible}
        onOpenChange={handleVisibleChange}
        trigger="contextMenu"
        placement="rightTop"
      >
        <Tag color={stringToColour(sectorSourceDataset.title)}>
          {isRootSector && sector.mode === "attach" && <CaretRightOutlined />}
          {isRootSector && sector.mode === "union" && (
            <BranchesOutlined
              rotate={90}
              style={{ fontSize: "16px", marginRight: "4px" }}
            />
          )}
          {isRootSector && sector.mode === "merge" && (
            <NodeCollapseOutlined
              style={{ fontSize: "16px", marginRight: "4px" }}
            />
          )}
          {sectorSourceDataset.alias || sectorSourceDataset.key}
          {runningSectorKeys.includes(sector.id) && (
            <SyncOutlined style={{ marginLeft: "5px" }} spin />
          )}
          {queuedSectorKeys.includes(sector.id) && (
            <HistoryOutlined style={{ marginLeft: "5px" }} />
          )}
          {sector?.subject?.broken === true && (
            <WarningOutlined
              style={{ fontSize: "16px", marginRight: "4px" }}
            />
          )}
          {(sector?.subject?.stale === true || sector?.target?.stale === true) && (
            <StaleNameWarning
              datasetKey={
                sector?.subject?.stale
                  ? sector?.subjectDatasetKey
                  : sector?.datasetKey
              }
              id={
                sector?.subject?.stale ? sector?.subject?.id : sector?.target?.id
              }
              storedName={
                sector?.subject?.stale
                  ? sector?.subject?.name
                  : sector?.target?.name
              }
            />
          )}
        </Tag>
      </Popover>
    </>
  ) : (
    <ColTreeContext.Consumer>
      {({ missingTargetKeys, applyDecision }) => (
        <Popover
          content={
            <div>
              {missingTargetKeys[_.get(sector, "target.id")] === true && (
                <Alert
                  type="warning"
                  style={{ marginBottom: "8px" }}
                  title={
                    <p>
                      {`${_.get(sector, "target.name")} with id: ${_.get(
                        sector,
                        "target.id"
                      )} is missing from the assembly.`}
                      <br />
                      {`You can delete this sector and reattach ${_.get(
                        sector,
                        "subject.name"
                      )} under ${_.get(
                        sector,
                        "target.name"
                      )} if present with another id`}
                    </p>
                  }
                ></Alert>
              )}
              {isRootSectorInSourceTree && (
                <CanEditDataset dataset={{ key: projectKey }}>
                  <Popconfirm
                    title={
                      <p style={{ width: "350px" }}>
                        Do you want a full deletion or a partial deletion? A
                        partial deletion will delete the sector mapping and
                        all species, but keep the higher classification above
                        species
                      </p>
                    }
                    onConfirm={() => {
                      deleteSector(sector, false);
                    }}
                    onCancel={() => {
                      deleteSector(sector, true);
                    }}
                    okText="Full"
                    cancelText="Partial"
                  >
                    <Button style={{ width: "100%" }} type="primary" danger>
                      Delete sector
                    </Button>
                  </Popconfirm>
                </CanEditDataset>
              )}
              {missingTargetKeys[_.get(sector, "target.id")] !== true && (
                <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  onClick={() => showSourceTaxon(taxon)}
                >
                  Show sector in assembly
                </Button>
              )}
              {isRootSectorInSourceTree &&
                missingTargetKeys[_.get(sector, "target.id")] !== true &&
                !runningSectorKeys.includes(sector.id) && (
                  <>
                    <CanEditDataset dataset={{ key: projectKey }}>
                      <Button
                        style={{ marginTop: "8px", width: "100%" }}
                        type="primary"
                        onClick={() => {
                          syncSector(sector);
                        }}
                      >
                        Sync sector
                      </Button>{" "}
                      <br />
                    </CanEditDataset>
                  </>
                )}
              {!isRootSectorInSourceTree && (
                <CanEditDataset dataset={{ key: projectKey }}>
                  <Input.TextArea
                    style={{ marginTop: "8px" }}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    placeholder="Note (optional)"
                    value={decisionNote}
                    onChange={(evt) => setDecisionNote(evt.target.value)}
                  />
                  <Button
                    style={{ marginTop: "8px", width: "100%" }}
                    type="primary"
                    danger
                    onClick={() => {
                      applyDecision(
                        taxon,
                        projectKey,
                        decisionCallback,
                        decisionNote.trim()
                      );
                      setDecisionNote("");
                      setPopOverVisible(false);
                    }}
                  >
                    Block taxon
                  </Button>
                </CanEditDataset>
              )}
              {error && (
                <Alert
                  style={{ marginTop: "8px" }}
                  closable={{ onClose: () => setError(null) }}
                  title={
                    <ErrorMsg error={error} style={{ marginTop: "8px" }} />
                  }
                  type="error"
                />
              )}
            </div>
          }
          title={
            <>
              Sector {sector.id} mode:{" "}
              {sector.mode === "attach" ? (
                <CaretRightOutlined />
              ) : (
                <BranchesOutlined
                  rotate={90}
                  style={{ fontSize: "16px", marginRight: "4px" }}
                />
              )}{" "}
              {sector.mode}
            </>
          }
          open={popOverVisible}
          onOpenChange={handleVisibleChange}
          trigger="contextMenu"
          placement="rightTop"
        >
          <Tag color={stringToColour(sectorSourceDataset.title)}>
            {missingTargetKeys[_.get(sector, "target.id")] === true && (
              <ExclamationCircleOutlined />
            )}
            {isRootSectorInSourceTree && sector.mode === "attach" && (
              <CaretRightOutlined />
            )}
            {isRootSectorInSourceTree && sector.mode === "union" && (
              <BranchesOutlined
                style={{ fontSize: "16px", marginRight: "4px" }}
                rotate={90}
              />
            )}
            {isRootSectorInSourceTree && sector.mode === "merge" && (
              <NodeCollapseOutlined
                style={{ fontSize: "16px", marginRight: "4px" }}
              />
            )}
            {sectorSourceDataset.alias || sectorSourceDataset.key}
            {runningSectorKeys.includes(sector.id) && (
              <SyncOutlined style={{ marginLeft: "5px" }} spin />
            )}
            {queuedSectorKeys.includes(sector.id) && (
              <HistoryOutlined style={{ marginLeft: "5px" }} />
            )}
            {sector?.subject?.broken === true && (
              <WarningOutlined
                style={{ fontSize: "16px", marginRight: "4px" }}
              />
            )}
            {(sector?.subject?.stale === true || sector?.target?.stale === true) && (
              <StaleNameWarning
                datasetKey={
                  sector?.subject?.stale
                    ? sector?.subjectDatasetKey
                    : sector?.datasetKey
                }
                id={
                  sector?.subject?.stale
                    ? sector?.subject?.id
                    : sector?.target?.id
                }
                storedName={
                  sector?.subject?.stale
                    ? sector?.subject?.name
                    : sector?.target?.name
                }
              />
            )}
          </Tag>
        </Popover>
      )}
    </ColTreeContext.Consumer>
  );
};

const mapContextToProps = ({
  user,
  projectKey,
  projectJobQueue,
  getProjectJobQueue,
}) => ({ user, projectKey, projectJobQueue, getProjectJobQueue });
export default withContext(mapContextToProps)(Sector);
