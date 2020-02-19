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


export const AssemblyNodeContent = ({}) => {

}

export const SourceNodeContent = ({}) => {
    
}

export const ReadOnlyNodeContent = ({}) => {
    
}