import React, { useEffect, useState } from "react";
import withContext from "../../../components/hoc/withContext";
import {
    Alert,
    Empty,
    Row,
    Col,
    Select,
    Popconfirm,
    Checkbox,
    Tag,
    Spin,
    Button,
    Tooltip,
    Slider
  } from "antd";
  import DatasetAutocomplete from "../../catalogue/Assembly/DatasetAutocomplete";
  import NameAutocomplete from "../../catalogue/Assembly/NameAutocomplete";
  import { withRouter } from "react-router-dom";

import TaxonBreakdown from "../../Taxon/TaxonBreakdown"


const TaxonSummary = ({datasetKey, taxon, onTaxonClick}) => {


    return <>
        <Row>
        <TaxonBreakdown taxon={taxon} datasetKey={datasetKey} onTaxonClick={onTaxonClick} />
        </Row>
    </>

}

const mapContextToProps = ({ addError, rank }) => ({ addError, rank });

export default withContext(mapContextToProps)(withRouter(TaxonSummary));

