
import React from "react";
import _ from 'lodash'
import { List, Breadcrumb, Button, Alert, Tooltip, notification } from "antd";
import ErrorMsg from '../../../components/ErrorMsg';
import PageContent from '../../../components/PageContent'
import RefTable from "../../catalogue/CatalogueReferences/RefTable"


export default  ({location, datasetKey}) => <PageContent>
    <RefTable location={location} datasetKey={datasetKey}/>
</PageContent>