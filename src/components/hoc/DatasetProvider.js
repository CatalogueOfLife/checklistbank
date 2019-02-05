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
      this.fetchDataset()
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
          this.fetchDataset()
      }
  };

  fetchDataset = () => {
    const {
      match: {
        params: { key }
      },
      setDataset,
      addError
    } = this.props;
    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}`)
      .then(res => {
        this.setState({ loading: false });

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

const mapContextToProps = ({ dataset, setDataset, addError }) => ({
  dataset,
  setDataset,
  addError
});

export default withContext(mapContextToProps)(DatasetProvider);
