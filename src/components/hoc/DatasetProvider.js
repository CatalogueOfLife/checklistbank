import React from "react";
import withContext from "./withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

class DatasetProvider extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: false
    };
  }
  componentDidMount = () => {
    const {
      match: {
        params: { key }
      },
      dataset
    } = this.props;
    if (Number(key) !== _.get(dataset, "key")) {
      this.fetchDataset(key)
  };
  }
  componentWillReceiveProps = nextProps => {
    const nextKey = _.get(nextProps, "match.params.key");
    const {
        match: {
          params: { key }
        }
      } = this.props;

      if(!this.state.loading && Number(key) !== Number(nextKey)){
          this.fetchDataset(nextKey)
      }
  };

  fetchDataset = (key) => {
    const {
      setDataset,
      setRecentDatasets,
      addError
    } = this.props;
    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}`)
      .then(res => {
        this.setState({ loading: false });

      const recentDatasetsAsText = localStorage.getItem('colplus_recent_datasets');
      let recentDatasets = recentDatasetsAsText ? JSON.parse(recentDatasetsAsText) : [];
      recentDatasets.unshift(res.data)
      recentDatasets = _.uniqBy(recentDatasets, 'key').slice(0, 5);  
      localStorage.setItem('colplus_recent_datasets', JSON.stringify(recentDatasets))
      setRecentDatasets(recentDatasets);
      setDataset(res.data);

      })
      .catch(err => {
        this.setState({ loading: false });
        addError(err);
      });
  };

  render = () => {
    return null;
  };
};

const mapContextToProps = ({ dataset, setDataset, setRecentDatasets, addError }) => ({
  dataset,
  setDataset,
  addError,
  setRecentDatasets
});

export default withContext(mapContextToProps)(DatasetProvider);
