import React from "react";
import PropTypes from "prop-types";
import Layout from "../../components/LayoutNew";
import config from "../../config";
import axios from "axios"
import VerbatimPresentation from "../../components/VerbatimPresentation"


class VerbatimRecord extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            dataset: null
        }
    }

    componentDidMount = () => {
        this.getDataset()
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
          const {dataset} = this.state;
    return    <Layout
            selectedMenuItem="datasetKey"
            selectedDataset={dataset}
            selectedVerbatimKey={verbatimKey}
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
          <VerbatimPresentation datasetKey={key} verbatimKey={verbatimKey} />
          </div>
          </Layout>
    }
}



export default VerbatimRecord
