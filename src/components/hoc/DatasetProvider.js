import React from "react";
import withContext from "./withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

class DatasetProvider extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: false,
      catalogueLoading: false
    };
  }
  componentDidMount = () => {
    const {
      match: {
        params: { key, catalogueKey }
      },
      dataset,
      catalogue
    } = this.props;
    if (Number(key) !== _.get(dataset, "key")) {
      this.fetchDataset(key)
  };
  if (Number(catalogueKey) !== _.get(catalogue, "key")) {
    this.fetchCatalogue(catalogueKey)
};
  
  }
  componentWillReceiveProps = nextProps => {
    const nextKey = _.get(nextProps, "match.params.key");
    const nextCatalogueKey = _.get(nextProps, "match.params.catalogueKey");
    const {
        match: {
          params: { key, catalogueKey }
        }
      } = this.props;

      if(!this.state.loading && Number(key) !== Number(nextKey)){
          this.fetchDataset(nextKey)
      }
      if(!this.state.catalogueLoading && Number(catalogueKey) !== Number(nextCatalogueKey)){
        this.fetchCatalogue(catalogueKey)    }
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

  fetchCatalogue = (key) => {
    const {
      setCatalogue,
      addError
    } = this.props;
    this.setState({ catalogueLoading: true });
    axios(`${config.dataApi}dataset/${key}`)
      .then(res => {
        this.setState({ catalogueLoading: false });
        setCatalogue(res.data);

      })
      .catch(err => {
        this.setState({ catalogueLoading: false });
        addError(err);
      });
  };
  render = () => {
    return null;
  };
};

const mapContextToProps = ({ catalogue, setCatalogue, dataset, setDataset, setRecentDatasets, addError }) => ({
  dataset,
  setDataset,
  addError,
  setRecentDatasets,
  catalogue, setCatalogue
});

export default withContext(mapContextToProps)(DatasetProvider);
