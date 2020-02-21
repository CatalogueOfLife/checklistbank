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

import history from "../../../history";


export const AssemblyNodeContent = ({mode}) => {
    mode === "modify" && 
     (
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
    )

}

export const SourceNodeContent = ({}) => {
    
}

export const ReadOnlyNodeContent = ({}) => {
    
}