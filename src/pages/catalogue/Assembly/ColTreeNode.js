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
import {NavLink} from 'react-router-dom'
import PopconfirmMultiOption from "../../../components/PopconfirmMultiOption"
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import { ColTreeContext } from "./ColTreeContext";
import Sector from "./Sector";
import DecisionTag from "../../WorkBench/DecisionTag";
import AddChildModal from "./AddChildModal";
import EditTaxonModal from "./EditTaxonModal";
import SpeciesEstimateModal from "./SpeciesEstimateModal";
import TaxonSources from "./TaxonSources"
import withContext from "../../../components/hoc/withContext";
import { stringToColour } from "../../../components/util";

import history from "../../../history";


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
    const { reloadChildren } = this.props;

    this.setState({ childModalVisible: false }, reloadChildren);
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
      treeType,
      isUpdating,
      getTaxonomicStatusColor,
      catalogueKey
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
            catalogueKey={catalogueKey}
          />
        )}

        <ColTreeContext.Consumer>
          {({ mode, selectedSourceDatasetKey, getSyncState }) =>
          <React.Fragment>
           {  mode === "modify" && 
            treeType === "CATALOGUE" && (
              <Popover
                content={
                  taxon.name !== "Not assigned" ?  <React.Fragment>
                    <Button
                      style={{ width: "100%" }}
                      type="primary"
                      onClick={() => {
                        history.push(
                          `/catalogue/${catalogueKey}/taxon/${taxon.id}`
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
                 
                  </React.Fragment> : 
                  <p>
                    This is a placeholder node for taxa that are not assigned to any <strong>{taxon.rank}</strong>.
                  </p>
                }
                title="Options"
                visible={this.state.popOverVisible}
                onVisibleChange={() =>
                  this.setState({ popOverVisible: !this.state.popOverVisible })
                }
                trigger="click"
                placement="bottom"
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
                    <Tag color={getTaxonomicStatusColor(taxon.status)} style={{ marginLeft: "6px" }}>
                      {taxon.status}
                    </Tag>
                  )}
                </Popconfirm>
              </Popover>
            )}
          
           { ((mode !== "modify" && treeType === "CATALOGUE") || (treeType === "SOURCE")) && (
              <PopconfirmMultiOption
                visible={this.props.confirmVisible}
                title={this.props.confirmTitle}
                onConfirm={this.props.onConfirm}
                actions={this.props.actions}
                onCancel={this.props.onCancel}
              >
                <div >
                  <span 
                  onContextMenu={()=> {
                    const uri = catalogueKey === taxon.datasetKey ? `/catalogue/${catalogueKey}/taxon/${taxon.id}` : `/catalogue/${catalogueKey}/dataset/${selectedSourceDatasetKey}/taxon/${taxon.id}`
                    const win = window.open(uri, '_blank');
                    win.focus();
                  }}>
                  <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                    {taxon.rank}:{" "}
                  </span>
                  <span 
                  dangerouslySetInnerHTML={{ __html: taxon.name }} 
                  />
                  </span>
                  {!_.isUndefined(taxon.speciesCount) && (
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
                  {taxon.datasetKey === catalogueKey &&
                    !datasetSectors &&
                    !sector && (
                      <Tooltip title="No sectors">
                        <Icon theme="filled" style={{ marginLeft: "6px", color: 'wheat' }} type="warning" />
                      </Tooltip>
                    )}
                  {datasetSectors && <TaxonSources datasetSectors={datasetSectors} taxon={taxon} catalogueKey={catalogueKey} />} 
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
              { treeType === "readOnly" && (
             
                <div >
                  <span 
                  onContextMenu={()=> {
                    const uri = `/catalogue/${catalogueKey}/dataset/${selectedSourceDatasetKey}/taxon/${taxon.id}`
                    const win = window.open(uri, '_blank');
                    win.focus();
                  }}>
                    <NavLink
                  to={{
                    pathname: `/catalogue/${catalogueKey}/dataset/${selectedSourceDatasetKey}/taxon/${taxon.id}`
                  }}
                  exact={true}
                >
            
                  <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                    {taxon.rank}:{" "}
                  </span>
                  <span 
                  dangerouslySetInnerHTML={{ __html: taxon.name }} 
                  />
                                    </NavLink>

                  </span>
                  {sector && (
                    <span>
                      <span> • </span>
                      <Tag color={stringToColour(sector.dataset.title)}>
                
                {sector.dataset.alias || sector.dataset.key}
                
              </Tag>
                    </span>
                  )}
                  
                  
                  {taxon.status !== "accepted" && (
                    <Tag color="red" style={{ marginLeft: "6px" }}>
                      {taxon.status}
                    </Tag>
                  )}
                 
                  {datasetSectors && <TaxonSources datasetSectors={datasetSectors} taxon={taxon} catalogueKey={catalogueKey} />} 
                  
                  
                </div>
            )
          }
          </React.Fragment>}
        </ColTreeContext.Consumer>
      </div>
    );
  };
}

const mapContextToProps = ({ getTaxonomicStatusColor, catalogueKey }) => ({ getTaxonomicStatusColor, catalogueKey });

export default withContext(mapContextToProps)(ColTreeNode);


