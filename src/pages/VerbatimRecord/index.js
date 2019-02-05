import React from "react";
import PropTypes from "prop-types";
import Layout from "../../components/LayoutNew";
import config from "../../config";
import axios from "axios"
import VerbatimPresentation from "../../components/VerbatimPresentation"
import qs from "query-string";
import _ from "lodash"
import {Alert} from "antd"
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext"

class VerbatimRecord extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            verbatim: [],
            verbatimError: null
        }
    }

    componentDidMount = () => {
        
        let params = qs.parse(_.get(this.props, "location.search"));
        this.getVerbatimData(params)   
    }

    componentWillReceiveProps(nextProps) {
        if(_.get(this.props, "location.search") !== _.get(nextProps, "location.search")){
           
            let params = qs.parse(_.get(nextProps, "location.search"));
            this.getVerbatimData(params) 
        }
    }

    getVerbatimData = (params) => {

        const {
            match: {
              params: { key }
            }
          } = this.props;
        axios(`${config.dataApi}dataset/${key}/verbatim?${qs.stringify(params)}`)
        .then(res => {
          this.setState({
            verbatim: res.data.result,
            verbatimError: null
          });
        })
        .catch(err => {
          this.setState({
            verbatimError: err,
            verbatim: []
          });
        });
    }

    render = () => {      
        const {
            dataset
          } = this.props; 
          const {verbatim, verbatimError} = this.state;
    return    <Layout
            selectedMenuItem="datasetKey"
            selectedDataset={dataset}
            openKeys={[ "datasetKey"]}
            selectedKeys={["verbatim"]}
          >
          <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            margin: "16px 0"
          }}
        >
        {verbatimError && (
              <Alert message={<ErrorMsg error={verbatimError} />} type="error" />
            )}
         {verbatim && verbatim.length > 0 && verbatim.map((v)=><VerbatimPresentation key={v.key} datasetKey={v.datasetKey} verbatimKey={v.key} basicHeader={true}/>)}
          </div>
          </Layout>
    }
}


const mapContextToProps = ({dataset}) => ({dataset})
export default withContext(mapContextToProps)(VerbatimRecord)
