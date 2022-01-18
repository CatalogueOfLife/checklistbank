import React from "react";

import {
  BranchesOutlined,
  CaretRightOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import {
  notification,
  Tag,
  Button,
  Tooltip,
  Popover,
  Alert,
  Switch,
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
import Auth from "../../../components/Auth";
import SectorForm from "./SectorForm";
import PresentationItem from "../../../components/PresentationItem";
import { CanEditDataset } from "../../../components/Auth/hasAccess";

class Sector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      popOverVisible: false,
      showEditForm: false,
      error: null,
      sectorDatasetRanks: [],
    };
  }

  hidePopover = () => {
    this.setState({
      popOverVisible: false,
    });
  };
  handleVisibleChange = (popOverVisible) => {
    this.setState({ popOverVisible, error: null });
  };

  syncSector = (sector, syncState, syncingSector) => {
    const { idle } = syncState;
    const { catalogueKey } = this.props;
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/sector/sync`, {
        sectorKey: sector.id,
        key: sector.id,
        target: sector.target,
        subject: sector.subject,
      })
      .then(() => {
        // If there is no sync jobs running, try to give the backend a chance to insert the root node again
        debounce(this.props.reloadSelfAndSiblings, 1500)();
        // this.props.reloadSelfAndSiblings();
        this.props.getSyncState();
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
        this.setState({ error: err });
      });
  };

  deleteSector = (sector) => {
    const { catalogueKey } = this.props;
    axios
      .delete(`${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`) // /assembly/3/sync/
      .then(() => {
        debounce(this.props.onDeleteSector, 500)();
        notification.open({
          message: "Deletion triggered",
          description: `Delete job for ${sector.id} placed on the sync queue`,
        });
      })
      .catch((err) => {
        this.setState({ error: err });
      });
  };

  applyDecision = () => {
    const { taxon, decisionCallback, catalogueKey } = this.props;

    const { datasetKey } = taxon;
    this.setState({ postingDecisions: true });

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
        return axios.post(`${config.dataApi}dataset/${catalogueKey}/decision`, {
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
          `${config.dataApi}dataset/${catalogueKey}/decision/${decisionId.data}`
        )
      )
      .then((res) => {
        taxon.decision = res;

        notification.open({
          message: `Decision applied`,
          description: `${_.get(taxon, "name").replace(
            /(<([^>]+)>)/gi,
            ""
          )} was blocked from the assembly`,
        });
        if (typeof decisionCallback === "function") {
          decisionCallback();
        }
      })
      .catch((err) => {
        notification.error({
          message: "Error",
          description: err.message,
        });
      });
  };
  getSectorDatasetRanks = () => {
    const {
      taxon: { sector },
    } = this.props;
    axios
      .get(
        `${config.dataApi}dataset/${sector.subjectDatasetKey}/nameusage/search?facet=rank&limit=0`
      ) // /assembly/3/sync/
      .then((res) => {
        this.setState({
          sectorDatasetRanks: _.get(res, "data.facets.rank", []).map(
            (r) => r.value
          ),
        });
      })
      .catch((err) => {
        this.setState({ error: err });
      });
  };
  render = () => {
    const { taxon, user, catalogueKey, syncState, syncingSector } = this.props;

    const { error, showEditForm, sectorDatasetRanks } = this.state;
    const { sector } = taxon;
    const { dataset: sectorSourceDataset } = sector;
    const isPlaceHolder = taxon.id.indexOf("--incertae-sedis--") > -1;
    const isRootSector =
      (!_.get(taxon, "parentId") && !isPlaceHolder) ||
      _.get(taxon, "sectorRoot") === true ||
      (_.get(sector, "target.id") &&
        sector.target &&
        taxon.parentId === sector.target.id);

    const isRootSectorInSourceTree = taxon.id === sector.subject.id;
    const isSourceTree = catalogueKey !== _.get(taxon, "datasetKey");

    if (!sectorSourceDataset) {
      return "";
    }
    return !isSourceTree ? (
      <Popover
        content={
          <div>
            {isRootSector && (
              <>
                <CanEditDataset dataset={{ key: catalogueKey }}>
                  <Tooltip title="Delete sector will delete the sector mapping and all species, but keep the higher classification above species">
                    <Button
                      style={{ width: "100%" }}
                      type="danger"
                      onClick={() => {
                        this.deleteSector(sector);
                      }}
                    >
                      Delete sector
                    </Button>
                  </Tooltip>
                  <br />

                  {_.get(syncState, "running.sectorKey") !== sector.id && (
                    <React.Fragment>
                      <Button
                        style={{ marginTop: "8px", width: "100%" }}
                        type="primary"
                        onClick={() => {
                          this.syncSector(sector, syncState, syncingSector);
                        }}
                      >
                        Sync sector
                      </Button>{" "}
                      <br />
                    </React.Fragment>
                  )}
                </CanEditDataset>
              </>
            )}
            <Button
              style={{ marginTop: "8px", width: "100%" }}
              type="primary"
              onClick={() => {
                history.push(
                  `/catalogue/${catalogueKey}/sector?id=${sector.id}`
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
                this.props.showSourceTaxon(sector, sectorSourceDataset)
              }
            >
              Show sector in source
            </Button>
            <br />
            <Button
              style={{ marginTop: "8px", width: "100%" }}
              type="primary"
              onClick={() => {
                history.push(`dataset/${sectorSourceDataset.key}/about`);
              }}
            >
              Source Dataset Metadata
            </Button>

            {isRootSector && (
              <CanEditDataset dataset={{ key: catalogueKey }}>
                {" "}
                <Switch
                  style={{ marginTop: "8px" }}
                  checked={showEditForm}
                  onChange={(checked) => {
                    this.getSectorDatasetRanks();
                    this.setState({ showEditForm: checked });
                  }}
                  checkedChildren="Finish edit"
                  unCheckedChildren="Edit sector"
                />
              </CanEditDataset>
            )}

            {isRootSector && showEditForm && (
              <SectorForm
                sectorDatasetRanks={sectorDatasetRanks}
                sector={sector}
                onError={(err) => this.setState({ error: err })}
              />
            )}
            {isRootSector && !showEditForm && (
              <React.Fragment>
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
              </React.Fragment>
            )}
            {error && (
              <Alert
                closable
                onClose={() => this.setState({ error: null })}
                message={
                  <ErrorMsg error={error} style={{ marginTop: "8px" }} />
                }
                type="error"
              />
            )}
          </div>
        }
        title={
          <React.Fragment>
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
          </React.Fragment>
        }
        visible={this.state.popOverVisible}
        onVisibleChange={this.handleVisibleChange}
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
          {sectorSourceDataset.alias || sectorSourceDataset.key}
          {_.get(syncState, "running.sectorKey") === sector.id && (
            <SyncOutlined style={{ marginLeft: "5px" }} spin />
          )}
          {_.find(
            _.get(syncState, "queued"),
            (e) => e.sectorKey === sector.id
          ) && <HistoryOutlined style={{ marginLeft: "5px" }} />}
        </Tag>
      </Popover>
    ) : (
      <ColTreeContext.Consumer>
        {({ missingTargetKeys }) => (
          <Popover
            content={
              <div>
                {missingTargetKeys[_.get(sector, "target.id")] === true && (
                  <Alert
                    type="warning"
                    style={{ marginBottom: "8px" }}
                    message={
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
                  <CanEditDataset dataset={{ key: catalogueKey }}>
                    <Button
                      style={{ width: "100%" }}
                      type="danger"
                      onClick={() => {
                        this.deleteSector(sector);
                      }}
                    >
                      Delete sector
                    </Button>
                  </CanEditDataset>
                )}
                {missingTargetKeys[_.get(sector, "target.id")] !== true && (
                  <Button
                    style={{ marginTop: "8px", width: "100%" }}
                    type="primary"
                    onClick={() => this.props.showSourceTaxon(sector)}
                  >
                    Show sector in assembly
                  </Button>
                )}
                {isRootSectorInSourceTree &&
                  missingTargetKeys[_.get(sector, "target.id")] !== true &&
                  _.get(syncState, "running.sectorKey") !== sector.id && (
                    <>
                      <CanEditDataset dataset={{ key: catalogueKey }}>
                        <Button
                          style={{ marginTop: "8px", width: "100%" }}
                          type="primary"
                          onClick={() => {
                            this.syncSector(sector, syncState, syncingSector);
                          }}
                        >
                          Sync sector
                        </Button>{" "}
                        <br />
                      </CanEditDataset>
                    </>
                  )}
                {!isRootSectorInSourceTree && (
                  <CanEditDataset dataset={{ key: catalogueKey }}>
                    <Button
                      style={{ marginTop: "8px", width: "100%" }}
                      type="danger"
                      onClick={this.applyDecision}
                    >
                      Block taxon
                    </Button>
                  </CanEditDataset>
                )}
                {error && (
                  <Alert
                    style={{ marginTop: "8px" }}
                    closable
                    onClose={() => this.setState({ error: null })}
                    message={
                      <ErrorMsg error={error} style={{ marginTop: "8px" }} />
                    }
                    type="error"
                  />
                )}
              </div>
            }
            title={
              <React.Fragment>
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
              </React.Fragment>
            }
            visible={this.state.popOverVisible}
            onVisibleChange={this.handleVisibleChange}
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
              {sectorSourceDataset.alias || sectorSourceDataset.key}
              {_.get(syncState, "running.sectorKey") === sector.id && (
                <SyncOutlined style={{ marginLeft: "5px" }} spin />
              )}
              {_.find(
                _.get(syncState, "queued"),
                (e) => e.sectorKey === sector.id
              ) && <HistoryOutlined style={{ marginLeft: "5px" }} />}
            </Tag>
          </Popover>
        )}
      </ColTreeContext.Consumer>
    );
  };
}

const mapContextToProps = ({
  user,
  catalogueKey,
  syncState,
  syncingSector,
  getSyncState,
}) => ({ user, catalogueKey, syncState, syncingSector, getSyncState });
export default withContext(mapContextToProps)(Sector);
