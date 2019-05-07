import React from "react";
import {
  notification,
  Tag,
  Popconfirm,
  Icon,
  Button,
  Popover,
  Tooltip
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import { ColTreeContext } from "./ColTreeContext";
import Sector from "./Sector";
import DecisionTag from "../WorkBench/DecisionTag";
import AddChildModal from "./AddChildModal";
const { MANAGEMENT_CLASSIFICATION } = config;

class ColTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {},
      popOverVisible: false,
      childModalVisible: false
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

  render = () => {
    const {
      taxon,
      taxon: { sector, decision, datasetSectors },
      hasPopOver,
      isUpdating
    } = this.props;
    const { childModalVisible } = this.state;
    const cancelChildModal = () => {
      this.setState({ childModalVisible: false });
    };
    return (
      <div>
        <ColTreeContext.Consumer>
          {({ mode }) =>
            mode === "modify" &&
            hasPopOver && (
              <Popover
                content={
                  <React.Fragment>
                    <Button
                      type="danger"
                      style={{ width: "100%" }}
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
                          childModalVisible: true,
                          popOverVisible: false
                        })
                      }
                    >
                      Add child
                    </Button>
                    {childModalVisible && (
                      <AddChildModal
                        onCancel={cancelChildModal}
                        onSuccess={cancelChildModal}
                        parent={taxon}
                      />
                    )}
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
                </Popconfirm>
              </Popover>
            )
          }
        </ColTreeContext.Consumer>
        <ColTreeContext.Consumer>
          {({ mode, selectedSourceDatasetKey, getSyncState }) =>
            (mode !== "modify" || !hasPopOver) && (
              <Popconfirm
                visible={this.props.confirmVisible}
                title={this.props.confirmTitle}
                onConfirm={this.props.onConfirm}
                onCancel={this.props.onCancel}
              >
                <div>
                  <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                    {taxon.rank}:{" "}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: taxon.name }} />
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
                  {taxon.datasetKey === MANAGEMENT_CLASSIFICATION.key && !datasetSectors && !sector && 
                  <Tooltip title="No sectors">
                  <Icon style={{marginLeft: "6px"}} type="disconnect"/>
                  </Tooltip>
                  }
                  {sector && mode !== "modify" && (
                    <span>
                      <span> • </span>
                      <Sector
                        {...this.props}
                        selectedSourceDatasetKey={selectedSourceDatasetKey}
                        getSyncState={getSyncState}
                      />
                    </span>
                  )}
                  {decision && (
                    <span>
                      <span> • </span>
                      <DecisionTag
                        {...this.props}
                        decision={decision}
                        deleteCallback={() =>
                          this.props.reloadSelfAndSiblings()
                        }
                      />
                    </span>
                  )}
                </div>
              </Popconfirm>
            )
          }
        </ColTreeContext.Consumer>
      </div>
    );
  };
}

export default ColTreeNode;
