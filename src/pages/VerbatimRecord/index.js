import React from "react";
import PropTypes from "prop-types";
import Layout from "../../components/LayoutNew";
import config from "../../config";
import axios from "axios"
import VerbatimPresentation from "../../components/VerbatimPresentation"
import qs from "query-string";
import _ from "lodash"


class VerbatimRecord extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            dataset: null,
            verbatim: []
        }
    }

    componentDidMount = () => {
        
        let params = qs.parse(_.get(this.props, "location.search"));
        this.getVerbatimData(params)   
        this.getDataset()
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
          });
        })
        .catch(err => {
          this.setState({
            datasetError: err,
            dataset: null
          });
        });
    }
    getDataset = () => {
        const {
          match: {
            params: { key }
          }
        } = this.props;
    
        axios(`${config.dataApi}dataset/${key}`)
          .then(res => {
            this.setState({
              dataset: res.data,
            });
          })
          .catch(err => {
            this.setState({
              datasetError: err,
              dataset: null
            });
          });
      };
    render = () => {      
        const {
            match: {
              params: { key, verbatimKey }
            }
          } = this.props; 
          const {dataset, verbatim} = this.state;
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
         {verbatim && verbatim.length > 0 && verbatim.map((v)=><VerbatimPresentation datasetKey={v.datasetKey} verbatimKey={v.key} />)}
          </div>
          </Layout>
    }
}



export default VerbatimRecord
