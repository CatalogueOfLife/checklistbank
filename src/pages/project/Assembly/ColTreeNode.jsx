import { useState } from "react";
import { SyncOutlined, WarningFilled, CopyOutlined } from "@ant-design/icons";
import MergedDataBadge from "../../../components/MergedDataBadge";
import {
  App,
  Tag,
  Popconfirm,
  Button,
  Popover,
  Tooltip,
} from "antd";
import { NavLink } from "react-router-dom";
import withRouter from "../../../withRouter";
import PopconfirmMultiOption from "../../../components/PopconfirmMultiOption";
import TextTreeUpload from "../../../components/TextTreeUpload";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import { ColTreeContext } from "./ColTreeContext";
import Sector from "./Sector";
import DecisionTag from "../../WorkBench/DecisionTag";
import AddChildModal from "./AddChildModal";
import EditTaxonModal from "./EditTaxonModal";
import SpeciesEstimateModal from "./SpeciesEstimateModal";
import UploadTextTreeModal from "./UploadTextTreeModal";
/* import TaxonSources from "./TaxonSources";
 */ import TaxonSources from "./TaxonSourcesNew";

import withContext from "../../../components/hoc/withContext";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CanEditDataset } from "../../../components/Auth/hasAccess";

import history from "../../../history";

const ColTreeNode = (props) => {
  const {
    taxon,
    taxon: { sector, datasetSectors, sourceDatasetKeys },
    treeType,
    isUpdating,
    getTaxonomicStatusColor,
    projectKey,
    dataset,
    reloadSelfAndSiblings,
    reloadChildren,
    addError,
    rank,
    location,
    confirmVisible,
    confirmTitle,
    onConfirm,
    onCancel,
    actions,
  } = props;

  const { notification, message } = App.useApp();
  const [decision, setDecision] = useState(taxon.decision);
  const [provisional, setProvisionalState] = useState(
    taxon.status === "provisionally accepted"
  );
  const [popOverVisible, setPopOverVisible] = useState(false);
  const [childModalVisible, setChildModalVisible] = useState(false);
  const [editTaxonModalVisible, setEditTaxonModalVisible] = useState(false);
  const [estimateModalVisible, setEstimateModalVisible] = useState(false);
  const [uploadTextTreeModalVisible, setUploadTextTreeModalVisible] = useState(false);
  const [subtreeDownloadPending, setSubtreeDownloadPending] = useState(false);

  const deleteTaxon = (taxon) => {
    axios
      .delete(`${config.dataApi}dataset/${taxon.datasetKey}/taxon/${taxon.id}`)
      .then(() => {
        reloadSelfAndSiblings();
        notification.open({
          message: "Taxon deleted",
          description: `${taxon.name} was deleted from the assembly`,
        });
      })
      .catch((err) => {
        addError && addError(err);
      });
  };

  const deleteTaxonBatch = (taxa) => {
    Promise.allSettled(
      taxa.map((taxon) =>
        axios.delete(
          `${config.dataApi}dataset/${taxon.datasetKey}/taxon/${taxon.id}`
        )
      )
    ).then((res) => {
      const errors = res.filter((r) => r.status === "rejected");
      if (errors.length > 0) {
        alert(
          `There were ${errors.length} errors out of ${taxa.length} deletions. Please reload trees and inspect carefully.`
        );
      }
      reloadSelfAndSiblings();
      notification.open({
        message: "Taxa deleted",
        description: `${taxa.length - errors.length
          } were deleted from the assembly`,
      });
    });
  };

  const deleteTaxonRecursiveBatch = (taxa) => {
    Promise.allSettled(
      taxa.map((taxon) =>
        axios.delete(
          `${config.dataApi}dataset/${taxon.datasetKey
          }/tree/${encodeURIComponent(taxon.id)}`
        )
      )
    ).then((res) => {
      const errors = res.filter((r) => r.status === "rejected");
      if (errors.length > 0) {
        alert(
          `There were ${errors.length} errors out of ${taxa.length} deletions. Please reload trees and inspect carefully.`
        );
      }
      reloadSelfAndSiblings();
      notification.open({
        message: "Taxa deleted",
        description: `${taxa.length - errors.length
          } were deleted recursively from the assembly`,
      });
    });
  };

  const deleteTaxonRecursive = (taxon) => {
    axios
      .delete(
        `${config.dataApi}dataset/${taxon.datasetKey}/tree/${encodeURIComponent(
          taxon.id
        )}`
      )
      .then(() => {
        reloadSelfAndSiblings();
        notification.open({
          message: "Taxon deleted",
          description: `${taxon.name} was deleted recursively from the assembly`,
        });
      })
      .catch((err) => {
        addError && addError(err);
      });
  };

  const setProvisional = (newProvisional, taxon) => {
    setProvisionalState(newProvisional);
    axios(`${config.dataApi}dataset/${taxon.datasetKey}/taxon/${taxon.id}`)
      .then((res) => res.data)
      .then((tx) =>
        axios.put(`${config.dataApi}dataset/${tx.datasetKey}/taxon/${tx.id}`, {
          ...tx,
          status: newProvisional ? "provisionally accepted" : "accepted",
        })
      )
      .then(() => {
        reloadSelfAndSiblings();
      })
      .catch(() => {});
  };

  const consolidateHomotypicNames = (taxon) => {
    axios
      .post(
        `${config.dataApi}dataset/${taxon.datasetKey
        }/consolidate-homotypic?taxonID=${encodeURIComponent(taxon.id)}`
      )
      .then(() => {
        reloadSelfAndSiblings();
        notification.open({
          message: "Homotypic grouping",
          description: `Consolidating homotypic names under ${taxon.name}`,
        });
      })
      .catch(() => {});
  };

  const cancelChildModal = () => {
    reloadChildren().then(() => setChildModalVisible(false));
  };

  const cancelEditTaxonModal = () => {
    setEditTaxonModalVisible(false);
    reloadSelfAndSiblings();
  };

  const cancelEstimateModal = () => {
    setEstimateModalVisible(false);
    reloadSelfAndSiblings();
  };

  const cancelUploadTextTreeModal = () => {
    setUploadTextTreeModalVisible(false);
    reloadSelfAndSiblings();
  };

  const getTaxonUrl = (selectedSourceDatasetKey) => {
    const urlAfterDatasetRoute = location.pathname?.split(`dataset/`)[1];
    const datasetKey = urlAfterDatasetRoute?.split("/")[0];
    return (
      location.pathname.split(`dataset/${datasetKey}`)[0] +
      `dataset/${datasetKey}/taxon/`
    );
  };

  const downloadSubtree = () => {
    try {
      setSubtreeDownloadPending(true);
      axios({
        url: `${config.dataApi}dataset/${taxon.datasetKey}/taxon/${encodeURIComponent(taxon.id)}/tree`,
        params: {extended: true},
        method: "GET",
        responseType: "blob",
      }).then((response) => {
        const href = URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = href;
        link.setAttribute("download", `${taxon.id}_tree.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
        setSubtreeDownloadPending(false);
      });
    } catch (error) {
      alert(error);
      setSubtreeDownloadPending(false);
    }
  };

  const rankIsAboveSpecies = (r) => {
    return rank.indexOf(r) < rank.indexOf("species");
  };

  const hasDatasetSectors =
    (sourceDatasetKeys || []).filter((d) => sector?.subjectDatasetKey !== d)
      .length > 0;

  const releaseKey = ["xrelease", "release"].includes(
    _.get(dataset, "origin")
  )
    ? dataset.key
    : null;

  return (
    <div>
      {childModalVisible && (
        <AddChildModal
          onCancel={cancelChildModal}
          onSuccess={cancelChildModal}
          parent={taxon}
        />
      )}
      {editTaxonModalVisible && (
        <EditTaxonModal
          onCancel={cancelEditTaxonModal}
          onSuccess={cancelEditTaxonModal}
          taxon={taxon}
        />
      )}
      {estimateModalVisible && (
        <SpeciesEstimateModal
          onCancel={cancelEstimateModal}
          onSuccess={cancelEstimateModal}
          taxon={taxon}
          projectKey={projectKey}
        />
      )}
      {uploadTextTreeModalVisible && (
        <UploadTextTreeModal
          onCancel={cancelUploadTextTreeModal}
          onSuccess={cancelUploadTextTreeModal}
          taxon={taxon}
        />
      )}
      <ColTreeContext.Consumer>
        {({ mode, selectedSourceDatasetKey, selectedAssemblyTreeNodes }) => {
          const taxonIsInSelectedNodes =
            selectedAssemblyTreeNodes &&
            selectedAssemblyTreeNodes.length > 1 &&
            selectedAssemblyTreeNodes.find((n) => n.taxon.id === taxon.id);
          return (
            <>
              {mode === "modify" && treeType === "CATALOGUE" && (
                <Popover
                  content={
                    taxon.name !== "Not assigned" ? (
                      <>
                        {!taxonIsInSelectedNodes && (
                          <>
                            {" "}
                            <Button
                              style={{ width: "100%" }}
                              type="primary"
                              onClick={() => {
                                history.push(
                                  `/project/${projectKey}/taxon/${taxon.id}`
                                );
                              }}
                            >
                              Show taxon
                            </Button>
                            <br />
                            <Button
                              style={{ marginTop: "8px", width: "100%" }}
                              type="primary"
                              onClick={downloadSubtree}
                              loading={subtreeDownloadPending}
                            >
                              Download subtree as text
                            </Button>
                            <CanEditDataset dataset={{ key: projectKey }}>
                              <br />
                              <Button
                                style={{ marginTop: "8px", width: "100%" }}
                                type="primary"
                                onClick={() =>
                                  setUploadTextTreeModalVisible(true)
                                }
                              >
                                Upload text tree
                              </Button>
                              <br />
                              <Button
                                style={{ marginTop: "8px", width: "100%" }}
                                type="primary"
                                onClick={() => {
                                  setChildModalVisible(true);
                                  setPopOverVisible(false);
                                }}
                              >
                                Add child
                              </Button>
                              <br />
                              <Button
                                style={{ marginTop: "8px", width: "100%" }}
                                danger
                                onClick={() => {
                                  setEditTaxonModalVisible(true);
                                  setPopOverVisible(false);
                                }}
                              >
                                Edit taxon
                              </Button>
                              <br />
                              <Button
                                danger
                                style={{ marginTop: "8px", width: "100%" }}
                                onClick={() => deleteTaxon(taxon)}
                              >
                                Delete taxon
                              </Button>
                              <br />
                              <Button
                                danger
                                style={{ marginTop: "8px", width: "100%" }}
                                onClick={() => deleteTaxonRecursive(taxon)}
                              >
                                Delete subtree
                              </Button>
                              <br />
                              <Button
                                type="primary"
                                style={{ marginTop: "8px", width: "100%" }}
                                onClick={() =>
                                  consolidateHomotypicNames(taxon)
                                }
                              >
                                Consolidate Homotypic Names
                              </Button>
                              <br />
                            </CanEditDataset>
                            <Button
                              style={{ marginTop: "8px", width: "100%" }}
                              type="primary"
                              onClick={() => {
                                setEstimateModalVisible(true);
                                setPopOverVisible(false);
                              }}
                            >
                              Estimates
                            </Button>
                          </>
                        )}
                        {taxonIsInSelectedNodes && (
                          <>
                            <Button
                              danger
                              style={{ marginTop: "8px", width: "100%" }}
                              onClick={() =>
                                deleteTaxonBatch(
                                  selectedAssemblyTreeNodes.map(
                                    (n) => n.taxon
                                  )
                                )
                              }
                            >
                              {`Delete ${selectedAssemblyTreeNodes.length} taxa`}
                            </Button>
                            <br />
                            <Button
                              danger
                              style={{ marginTop: "8px", width: "100%" }}
                              onClick={() =>
                                deleteTaxonRecursiveBatch(
                                  selectedAssemblyTreeNodes.map(
                                    (n) => n.taxon
                                  )
                                )
                              }
                            >
                              {`Delete subtrees for ${selectedAssemblyTreeNodes.length} taxa`}
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <p>
                        This is a placeholder node for taxa that are not
                        assigned to any <strong>{taxon.rank}</strong>.
                      </p>
                    )
                  }
                  title="Options"
                  open={popOverVisible}
                  onOpenChange={() => setPopOverVisible(!popOverVisible)}
                  trigger="contextMenu"
                  placement="bottom"
                >
                  <Popconfirm
                    open={confirmVisible}
                    title={confirmTitle}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                  >
                    <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                      {taxon.rank}:{" "}
                    </span>

                    <span
                      dangerouslySetInnerHTML={{ __html: taxon.labelHtml }}
                    />
                    <span>
                      {taxon?.merged && (
                        <MergedDataBadge style={{ marginLeft: "4px" }} />
                      )}
                    </span>
                    {mode === "modify" && taxon.estimate && (
                      <span>
                        {" "}
                        • {taxon.estimate.toLocaleString("en-GB")} est. spp.{" "}
                        {taxon.estimates.length
                          ? `(${taxon.estimates.length.toLocaleString(
                            "en-GB"
                          )} ${taxon.estimates.length > 1
                            ? "estimates"
                            : "estimate"
                          })`
                          : ""}
                      </span>
                    )}
                    {isUpdating && (
                      <span>
                        {" "}
                        <SyncOutlined spin />
                      </span>
                    )}
                    {taxon.status === "provisionally accepted" && (
                      <>
                        {" "}
                        •{" "}
                        <Tag
                          color={getTaxonomicStatusColor(taxon.status)}
                          style={{ marginRight: 0 }}
                        >
                          prov.
                        </Tag>
                      </>
                    )}
                  </Popconfirm>
                </Popover>
              )}

              {((mode !== "modify" && treeType === "CATALOGUE") ||
                treeType === "SOURCE") && (
                  <PopconfirmMultiOption
                    open={confirmVisible}
                    title={confirmTitle}
                    onConfirm={onConfirm}
                    actions={actions}
                    onCancel={onCancel}
                  >
                    <div>
                      <span>
                        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                          {taxon.rank}:{" "}
                        </span>

                        <span
                          dangerouslySetInnerHTML={{
                            __html: taxon.labelHtml,
                          }}
                        />
                        <span style={{ color: "rgba(0, 0, 0, 0.85)" }}>
                          {taxon?.merged && (
                            <MergedDataBadge style={{ marginLeft: "4px" }} />
                          )}
                        </span>
                        <CopyToClipboard
                          text={taxon.name}
                          onCopy={() =>
                            message.info(`Copied "${taxon.name}" to clipboard`)
                          }
                        >
                          <CopyOutlined
                            style={{ fontSize: "10px", marginLeft: "4px" }}
                          />
                        </CopyToClipboard>
                      </span>

                      {!_.isUndefined(taxon.count) &&
                        rankIsAboveSpecies(taxon?.rank) && (
                          <span>
                            {" "}
                            • {Number(taxon.count).toLocaleString()}{" "}
                            {!_.isUndefined(taxon.speciesEstimate) && (
                              <span>
                                {" "}
                                of{" "}
                                {Number(
                                  taxon.speciesEstimate
                                ).toLocaleString()}{" "}
                                est.{" "}
                              </span>
                            )}
                            spp.
                          </span>
                        )}
                      {isUpdating && (
                        <span>
                          {" "}
                          <SyncOutlined spin />
                        </span>
                      )}
                      {taxon.status === "provisionally accepted" && (
                        <>
                          {" "}
                          •{" "}
                          <Tag
                            color={getTaxonomicStatusColor(taxon.status)}
                            style={{ marginRight: 0 }}
                          >
                            prov.
                          </Tag>
                        </>
                      )}
                      {taxon.datasetKey === projectKey &&
                        !hasDatasetSectors &&
                        !sector && (
                          <Tooltip title="No sectors">
                            <WarningFilled
                              style={{ marginLeft: "6px", color: "wheat" }}
                            />
                          </Tooltip>
                        )}
                      {hasDatasetSectors && (
                        <span>
                          <span> • </span>
                          <TaxonSources
                            sourceDatasetKeys={sourceDatasetKeys}
                          taxon={taxon}
                            releaseKey={releaseKey}
                            projectKey={projectKey}
                          />
                        </span>
                      )}
                      {sector && mode !== "modify" && (
                        <span>
                          <span> • </span>
                          <Sector
                            {...props}
                            selectedSourceDatasetKey={selectedSourceDatasetKey}
                            decisionCallback={(d) => setDecision(d)}
                          />
                        </span>
                      )}
                      {decision && (
                        <span>
                          <span> • </span>
                          <DecisionTag
                            {...props}
                            decision={decision}
                            deleteCallback={() => setDecision(null)}
                          />
                        </span>
                      )}
                    </div>
                  </PopconfirmMultiOption>
                )}
              {treeType === "readOnly" && (
                <div>
                  <span>
                    <NavLink
                      to={{
                        pathname: `${getTaxonUrl(
                          selectedSourceDatasetKey
                        )}${encodeURIComponent(taxon.id)}`,
                      }}
                      end
                    >
                      <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                        {taxon.rank}:{" "}
                      </span>

                      <span
                        dangerouslySetInnerHTML={{
                          __html: taxon.labelHtml,
                        }}
                      />
                      <span style={{ color: "rgba(0, 0, 0, 0.85)" }}>
                        {taxon?.merged && (
                          <MergedDataBadge style={{ marginLeft: "4px" }} />
                        )}
                      </span>
                    </NavLink>
                  </span>
                  {!_.isUndefined(taxon.count) &&
                    rankIsAboveSpecies(taxon?.rank) && (
                      <span>
                        {" "}
                        • {Number(taxon.count).toLocaleString()}{" "}
                        {taxon.estimate && (
                          <span>
                            {" "}
                            of {Number(
                              taxon.estimate
                            ).toLocaleString()} est.{" "}
                          </span>
                        )}
                        species
                      </span>
                    )}

                  {taxon.status === "provisionally accepted" && (
                    <>
                      {" "}
                      •{" "}
                      <Tag
                        color={getTaxonomicStatusColor(taxon.status)}
                        style={{ marginRight: 0 }}
                      >
                        prov.
                      </Tag>
                    </>
                  )}
                  {(sector || hasDatasetSectors) && <span> • </span>}
                  {sector && (
                    <span>
                      <NavLink
                        to={{
                          pathname: releaseKey
                            ? `/dataset/${releaseKey}/source/${sector?.dataset?.key}`
                            : `/dataset/${sector?.dataset?.key}/metadata`,
                        }}
                        end
                      >
                        {" "}
                        <span
                          style={
                            hasDatasetSectors
                              ? { fontWeight: "bold", fontSize: "11px" }
                              : { fontSize: "11px" }
                          }
                        >
                          {sector?.dataset?.alias ||
                            sector?.dataset?.key ||
                            ""}
                          {hasDatasetSectors && ", "}
                        </span>
                      </NavLink>
                    </span>
                  )}
                  {hasDatasetSectors && (
                    <TaxonSources
                      sourceDatasetKeys={sourceDatasetKeys}
                      taxon={taxon}
                      releaseKey={releaseKey}
                      projectKey={projectKey}
                    />
                  )}
                </div>
              )}
            </>
          );
        }}
      </ColTreeContext.Consumer>
    </div>
  );
};

const mapContextToProps = ({
  getTaxonomicStatusColor,
  projectKey,
  addError,
  rank,
}) => ({
  getTaxonomicStatusColor,
  projectKey,
  addError,
  rank,
});

export default withContext(mapContextToProps)(withRouter(ColTreeNode));
