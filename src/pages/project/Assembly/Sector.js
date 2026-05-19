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
  notification,
  Tag,
  Button,
  Popover,
  Alert,
  Popconfirm,
  Modal,
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import history from "../../../history";
import { stringToColour } from "../../../components/util";
import { ColTreeContext } from "./ColTreeContext";
import ErrorMsg from "../../../components/ErrorMsg";
import withContext from "../../../components/hoc/withContext";
import { debounce } from "lodash";
import SectorForm from "./SectorForm";
import PresentationItem from "../../../components/PresentationItem";
import { CanEditDataset } from "../../../components/Auth/hasAccess";

const Sector = ({
  taxon,
  user,
  projectKey,
  syncState,
  syncingSector,
  getSyncState,
  decisionCallback,
  reloadSelfAndSiblings,
  onDeleteSector,
  showSourceTaxon,
}) => {
  const [popOverVisible, setPopOverVisible] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState(null);
  const [sectorDatasetRanks, setSectorDatasetRanks] = useState(null);

  const hidePopover = () => {
    setPopOverVisible(false);
  };

  const handleVisibleChange = (visible) => {
    if (!showEditForm) {
      setPopOverVisible(visible);
      setError(null);
    }
  };

  const syncSector = (sector, syncState, syncingSector) => {
    const { idle } = syncState;
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
        getSyncState();
        notification.open({
          message: idle ? "Sync started" : "Sync queued",
          description:
            !syncingSector && idle
              ? `Copying taxa from ${sector.id}`
              : `Awaiting sector ${_.get(syncingSector, "id")} (${_.get(
                  syncingSector,
                  "subject.name"
                )})`,
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
          message: "Deletion triggered",
          description: `${partial ? "Partial" : "Full"} delete job for ${
            sector.id
          } placed on the sync queue`,
        });
      })
      .catch((err) => {
        setError(err);
      });
  };

  const applyDecision = (taxon) => {
    const { datasetKey } = taxon;
    // Note: postingDecisions state was set but never read in original; omitted
    return axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${_.get(taxon, "id")}`
    )
      .then((tx) => {
        return Promise.all([
          tx,
          axios(
            `${config.dataApi}dataset/${datasetKey}/taxon/${_.get(
              tx,
              "data.parentId"
            )}`
          ),
        ]);
      })

      .then((taxa) => {
        const tx = taxa[0].data;
        const parent = taxa[1].data;
        return axios.post(`${config.dataApi}dataset/${projectKey}/decision`, {
          subjectDatasetKey: datasetKey,
          subject: {
            id: _.get(tx, "id"),

            name: _.get(tx, "name.scientificName"), //.replace(/(<([^>]+)>)/ig , "")
            authorship: _.get(tx, "name.authorship"),
            rank: _.get(tx, "name.rank"),
            status: _.get(tx, "status"),
            parent: _.get(parent, "name.scientificName"),
            code: _.get(tx, "name.code"),
          },
          mode: "block",
        });
      })
      .then((decisionId) =>
        axios(
          `${config.dataApi}dataset/${projectKey}/decision/${decisionId.data}`
        )
      )
      .then((res) => {
        taxon.decision = res.data;

        notification.open({
          message: `Decision applied`,
          description: `${_.get(taxon, "name").replace(
            /(<([^>]+)>)/gi,
            ""
          )} was blocked from the project`,
        });
        if (typeof decisionCallback === "function") {
          decisionCallback(res.data);
        }
        setPopOverVisible(false);
      })
      .catch((err) => {
        notification.error({
          message: "Error",
          description: err.message,
        });
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
                    <Button style={{ width: "100%" }} danger>
                      Delete sector
                    </Button>
                  </Popconfirm>
                  <br />

                  {_.get(syncState, "running.sectorKey") !== sector.id && (
                    <>
                      <Button
                        style={{ marginTop: "8px", width: "100%" }}
                        type="primary"
                        onClick={() => {
                          syncSector(sector, syncState, syncingSector);
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
                  `/project/${projectKey}/sector?id=${sector.id}`
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
          {_.get(syncState, "running.sectorKey") === sector.id && (
            <SyncOutlined style={{ marginLeft: "5px" }} spin />
          )}
          {_.find(
            _.get(syncState, "queued"),
            (e) => e.sectorKey === sector.id
          ) && <HistoryOutlined style={{ marginLeft: "5px" }} />}
          {sector?.subject?.broken === true && (
            <WarningOutlined
              style={{ fontSize: "16px", marginRight: "4px" }}
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
                    <Button style={{ width: "100%" }} danger>
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
                _.get(syncState, "running.sectorKey") !== sector.id && (
                  <>
                    <CanEditDataset dataset={{ key: projectKey }}>
                      <Button
                        style={{ marginTop: "8px", width: "100%" }}
                        type="primary"
                        onClick={() => {
                          syncSector(sector, syncState, syncingSector);
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
                  <Button
                    style={{ marginTop: "8px", width: "100%" }}
                    danger
                    onClick={() => {
                      applyDecision(taxon, projectKey, decisionCallback);
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
            {_.get(syncState, "running.sectorKey") === sector.id && (
              <SyncOutlined style={{ marginLeft: "5px" }} spin />
            )}
            {_.find(
              _.get(syncState, "queued"),
              (e) => e.sectorKey === sector.id
            ) && <HistoryOutlined style={{ marginLeft: "5px" }} />}
            {sector?.subject?.broken === true && (
              <WarningOutlined
                style={{ fontSize: "16px", marginRight: "4px" }}
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
  syncState,
  syncingSector,
  getSyncState,
}) => ({ user, projectKey, syncState, syncingSector, getSyncState });
export default withContext(mapContextToProps)(Sector);
