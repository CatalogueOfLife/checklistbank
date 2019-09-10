import React from "react";
import {
  notification,
  Tag,
  Popconfirm,
  Icon,
  Button,
  Popover,
  Tooltip,
  Checkbox
} from "antd";
import PopconfirmMultiOption from "../../components/PopconfirmMultiOption"
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import { ColTreeContext } from "./ColTreeContext";
import Sector from "./Sector";
import DecisionTag from "../WorkBench/DecisionTag";
import AddChildModal from "./AddChildModal";
import EditTaxonModal from "./EditTaxonModal";
import SpeciesEstimateModal from "./SpeciesEstimateModal";
// import ColTreeActions from "./ColTreeActions"

import history from "../../history";

const { MANAGEMENT_CLASSIFICATION } = config;

class ColTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {},
      provisional: this.props.taxon.status === 'provisionally accepted',
      popOverVisible: false,
      childModalVisible: false,
      editTaxonModalVisible: false,
      estimateModalVisible: false
    };
  }
  setMode = mode => {
    this.setState({ mode });
  };

  deleteTaxon = taxon => {
    axios
      .delete(`${config.dataApi}dataset/${taxon.datasetKey}/taxon/${taxon.id}`)
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Taxon deleted",
          description: `${taxon.name} was deleted from the CoL draft`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  deleteTaxonRecursive = taxon => {
    axios
      .delete(`${config.dataApi}dataset/${taxon.datasetKey}/tree/${taxon.id}`)
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Taxon deleted",
          description: `${taxon.name} was deleted from the CoL draft`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };
  setProvisional = (provisional, taxon) => {
    const { reloadSelfAndSiblings } = this.props;
    this.setState({provisional})
    axios(`${config.dataApi}dataset/${taxon.datasetKey}/taxon/${taxon.id}`)
    .then((res)=> res.data)
    .then((tx)=> axios.put(`${config.dataApi}dataset/${tx.datasetKey}/taxon/${tx.id}`, 
    {...tx, status: provisional ? 'provisionally accepted':'accepted'})
    )
    .then(res => {
      reloadSelfAndSiblings()
    })
    .catch(err => {
      this.setState({ error: err });
    });
  
  };

  cancelChildModal = () => {
    const { reloadSelfAndSiblings } = this.props;

    this.setState({ childModalVisible: false }, reloadSelfAndSiblings);
  };

  cancelEditTaxonModal = () => {
    const { reloadSelfAndSiblings } = this.props;

    this.setState({ editTaxonModalVisible: false }, reloadSelfAndSiblings);
  };

  cancelEstimateModal = () => {
    const { reloadSelfAndSiblings } = this.props;

    this.setState({ estimateModalVisible: false }, reloadSelfAndSiblings);
  }
  render = () => {
    const {
      taxon,
      taxon: { sector, decision, datasetSectors },
      hasPopOver,
      isUpdating
    } = this.props;
    const { childModalVisible, editTaxonModalVisible, estimateModalVisible } = this.state;

    return (
      <div>
        {childModalVisible && (
          <AddChildModal
            onCancel={this.cancelChildModal}
            onSuccess={this.cancelChildModal}
            parent={taxon}
          />
        )}
         {editTaxonModalVisible && (
          <EditTaxonModal
            onCancel={this.cancelEditTaxonModal}
            onSuccess={this.cancelEditTaxonModal}
            taxon={taxon}
          />
        )}
        {estimateModalVisible && (
          <SpeciesEstimateModal
            onCancel={this.cancelEstimateModal}
            onSuccess={this.cancelEstimateModal}
            taxon={taxon}
          />
        )}

        <ColTreeContext.Consumer>
          {({ mode }) =>
            mode === "modify" &&
            hasPopOver && (
              <Popover
                content={
                  <React.Fragment>
                    <Button
                      style={{ width: "100%" }}
                      type="primary"
                      onClick={() => {
                        history.push(
                          `/dataset/${taxon.datasetKey}/taxon/${taxon.id}`
                        );
                      }}
                    >
                      Show taxon
                    </Button>

                    <br />
                    <Button
                      style={{ marginTop: "8px", width: "100%" }}
                      type="primary"
                      onClick={() =>
                        this.setState({
                          childModalVisible: true,
                          popOverVisible: false
                        })
                      }
                    >
                      Add child
                    </Button>
                    <br />
                    <Button
                      style={{ marginTop: "8px", width: "100%" }}
                      type="danger"
                      onClick={() =>
                        this.setState({
                          editTaxonModalVisible: true,
                          popOverVisible: false
                        })
                      }
                    >
                      Edit taxon
                    </Button>
                    <br />
                    <Button
                      type="danger"
                      style={{ marginTop: "8px", width: "100%" }}
                      onClick={() => this.deleteTaxon(taxon)}
                    >
                      Delete taxon
                    </Button>
                    <br />
                    <Button
                      type="danger"
                      style={{ marginTop: "8px", width: "100%" }}
                      onClick={() => this.deleteTaxonRecursive(taxon)}
                    >
                      Delete subtree
                    </Button>
                    <br />
                    <Button
                      style={{ marginTop: "8px", width: "100%" }}
                      type="primary"
                      onClick={() =>
                        this.setState({
                          estimateModalVisible: true,
                          popOverVisible: false
                        })
                      }
                    >
                      Estimates
                    </Button>
                 { /*  <Checkbox
                      style={{ marginTop: "8px", width: "100%" }}
                      checked={this.state.provisional}
                      onChange={e =>
                        this.setProvisional(e.target.checked, taxon)
                      }
                    >
                      {" "}
                      Provisional{" "}
                    </Checkbox> */}
                  </React.Fragment>
                }
                title="Options"
                visible={this.state.popOverVisible}
                onVisibleChange={() =>
                  this.setState({ popOverVisible: !this.state.popOverVisible })
                }
                trigger="click"
                placement="rightTop"
              >
                <Popconfirm
                  visible={this.props.confirmVisible}
                  title={this.props.confirmTitle}
                  onConfirm={this.props.onConfirm}
                  onCancel={this.props.onCancel}
                >
                  <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                    {taxon.rank}:{" "}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
                  {mode === "modify" && taxon.estimate && (
                    <span>
                     {" "}
                      • 
                      {" "}
                      {taxon.estimate.toLocaleString('en-GB')} est. described species {taxon.estimates.length ? `(${taxon.estimates.length.toLocaleString('en-GB')} ${taxon.estimates.length > 1 ? "estimates": "estimate"})`: ""}
                    </span>
                  )}
                  {isUpdating && (
                    <span>
                      {" "}
                      <Icon type="sync" spin />
                    </span>
                  )}
                  {taxon.status !== "accepted" && (
                    <Tag color="red" style={{ marginLeft: "6px" }}>
                      {taxon.status}
                    </Tag>
                  )}
                </Popconfirm>
              </Popover>
            )
          }
        </ColTreeContext.Consumer>
        <ColTreeContext.Consumer>
          {({ mode, selectedSourceDatasetKey, getSyncState }) =>
            (mode !== "modify" || !hasPopOver) && (
              <PopconfirmMultiOption
                visible={this.props.confirmVisible}
                title={this.props.confirmTitle}
                onConfirm={this.props.onConfirm}
                actions={this.props.actions}
                onCancel={this.props.onCancel}
              >
                <div >
                  <span onClick={() => { history.push(`/dataset/${taxon.datasetKey === MANAGEMENT_CLASSIFICATION.key ? MANAGEMENT_CLASSIFICATION.key : selectedSourceDatasetKey}/taxon/${taxon.id}`);}}
                  onContextMenu={()=> {
                    const win = window.open(`/dataset/${taxon.datasetKey === MANAGEMENT_CLASSIFICATION.key ? MANAGEMENT_CLASSIFICATION.key : selectedSourceDatasetKey}/taxon/${taxon.id}`, '_blank');
                    win.focus();
                  }}>
                  <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                    {taxon.rank}:{" "}
                  </span>
                  <span 
                  dangerouslySetInnerHTML={{ __html: taxon.name }} 
                  />
                  </span>
                  {mode === "modify" && !_.isUndefined(taxon.speciesCount) && (
                    <span>
                      {" "}
                      • {taxon.speciesCount}{" "}
                      {!_.isUndefined(taxon.speciesEstimate) && (
                        <span> of {taxon.speciesEstimate} est. </span>
                      )}
                      living species
                    </span>
                  )}
                  {isUpdating && (
                    <span>
                      {" "}
                      <Icon type="sync" spin />
                    </span>
                  )}
                  {taxon.status !== "accepted" && (
                    <Tag color="red" style={{ marginLeft: "6px" }}>
                      {taxon.status}
                    </Tag>
                  )}
                  {taxon.datasetKey === MANAGEMENT_CLASSIFICATION.key &&
                    !datasetSectors &&
                    !sector && (
                      <Tooltip title="No sectors">
                        <Icon style={{ marginLeft: "6px" }} type="disconnect" />
                      </Tooltip>
                    )}
                  {sector && mode !== "modify" && (
                    <span>
                      <span> • </span>
                      <Sector
                        {...this.props}
                        selectedSourceDatasetKey={selectedSourceDatasetKey}
                        getSyncState={getSyncState}
                        decisionCallback={this.props.reloadSelfAndSiblings}
                      />
                    </span>
                  )}
                  {decision && (
                    <span>
                      <span> • </span>
                      <DecisionTag
                        {...this.props}
                        decision={decision}
                        deleteCallback={this.props.reloadSelfAndSiblings}
                      />
                    </span>
                  )}
                </div>
              </PopconfirmMultiOption>
            )
          }
        </ColTreeContext.Consumer>
      </div>
    );
  };
}

export default ColTreeNode;
