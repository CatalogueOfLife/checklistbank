import React from "react";
import {
  Alert
} from "antd";
import axios from "axios";
import config from "../../../config";
import _ from "lodash";
import history from "../../../history";
import ErrorMsg from "../../../components/ErrorMsg";
import ChildLessRootsTable from "./ChildLessRootsTable";
import PageContent from "../../../components/PageContent";
import ColTree from "../../Assembly/ColTree";
import { ColTreeContext } from "../../Assembly/ColTreeContext"
import queryString from "query-string";
import Auth from "../../../components/Auth";
import withContext from "../../../components/hoc/withContext"
import NameAutocomplete from "../../Assembly/NameAutocomplete"
import ColTreeActions from "../../Assembly/ColTreeActions"
const {MANAGEMENT_CLASSIFICATION} = config;

class DatasetClassification extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rootLoading: true,
      treeData: [],
      loadedKeys: [],
      expandedKeys: [],
      childlessRoots: null
    };
  }

  componentWillMount() {
    this.loadRoot();
  }

  loadRoot = () => {
    const { dataset: {key} } = this.props;
    axios(`${config.dataApi}dataset/${key}/tree`)
      .then(res => {
        this.setState({
          childlessRoots: res.data.result.filter(r => r.childCount === 0)
            
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  render() {
    const {
      childlessRoots,
      error
    } = this.state;
    const { dataset, location, user } = this.props;
    const params = queryString.parse(this.props.location.search);

    return (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error} />} type="error" />}
        {childlessRoots && childlessRoots.length > 0 && (
          <Alert
            style={{ marginBottom: "10px" }}
            message={`There are ${
              childlessRoots.length
            } root taxa with no children in this dataset. They are listed below the tree`}
            type="warning"
          />
        )}
        {dataset && (
                    <NameAutocomplete
                      datasetKey={dataset.key}
                      onSelectName={name => {
                        history.push({
                          pathname: `/dataset/${dataset.key}/classification`,
                          search: `?${queryString.stringify({sourceTaxonKey: _.get(name, "key")})}`
                        });

                        ColTreeActions.refreshSource()
                      }}
                      onResetSearch={() => {
                        history.push({
                          pathname: `/dataset/${dataset.key}/classification`,
                        });
                      }}
                    />
                  )}
        <ColTreeContext.Provider
        value={{
          mode: "ATTACH",
          toggleMode: ()=>{},
          getSyncState: ()=>{ return {}},
          syncState: { idle: true}, // Assume queue is empty
          syncingSector: null,
          missingTargetKeys: {},
          selectedSourceDatasetKey: dataset.key
        }}
      >
        <ColTree 
          dataset={dataset} 
          treeType="gsd"
          catalogueKey={MANAGEMENT_CLASSIFICATION.key}
          defaultExpandKey={params.sourceTaxonKey}
          location={location}
          showSourceTaxon={sector => {
            if(Auth.isAuthorised(user, ["editor", "admin"])){
              const params = {
                sourceTaxonKey: _.get(sector, "subject.id"),
                assemblyTaxonKey: _.get(sector, "target.id"),
                datasetKey: dataset.key
              };
  
              history.push({
                pathname: `/assembly`,
                search: `?${queryString.stringify(params)}`
              });
            } else {
              
              history.push({
                pathname: `/dataset/${MANAGEMENT_CLASSIFICATION.key}/classification`,
                search: `?${queryString.stringify({sourceTaxonKey: _.get(sector, "target.id")})}`
              });
            }
            
          }}
           />
</ColTreeContext.Provider>
        {childlessRoots && childlessRoots.length > 0 && (
          <ChildLessRootsTable datasetKey={dataset.key} data={childlessRoots} />
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({user}) => ({user})
export default withContext(mapContextToProps)(DatasetClassification);
