import React from "react";
import withContext from "./withContext";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import { withRouter } from "react-router-dom";
class DatasetProvider extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: false,
      catalogueLoading: false,
    };
  }
  componentDidMount = () => {
    const {
      match: {
        params: { key, catalogueKey },
      },
      dataset,
      catalogue,
    } = this.props;
    if (key && key !== _.get(dataset, "key")) {
      this.fetchDataset(key);
    }
    if (
      catalogueKey &&
      Number(catalogueKey) !== Number(_.get(catalogue, "key"))
    ) {
      this.fetchCatalogue(catalogueKey);
    }
  };

  componentDidUpdate = (prevProps) => {
    const nextKey = _.get(this.props, "match.params.key");
    const nextCatalogueKey = _.get(this.props, "match.params.catalogueKey");

    if (nextKey === "1008") {
      console.log("test");
    }
    const {
      match: {
        params: { key, catalogueKey },
      },
    } = prevProps;

    if (nextKey && !this.state.loading && key !== nextKey) {
      this.fetchDataset(nextKey);
    }
    if (
      nextCatalogueKey &&
      !this.state.catalogueLoading &&
      Number(catalogueKey) !== Number(nextCatalogueKey)
    ) {
      this.fetchCatalogue(nextCatalogueKey);
    }
  };

  fetchDataset = (key) => {
    const { setCatalogue, setDataset, setRecentDatasets, addError } =
      this.props;
    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => {
        return axios(
          `${config.dataApi}dataset?limit=1000&hasSourceDataset=${key}&origin=PROJECT`
        ).then((projects) => {
          if (_.get(projects, "data.result")) {
            res.data.contributesTo = projects.data.result.map((r) => r.key);
          }
          return res;
        });
      })
      .then((res) => {
        this.setState({ loading: false });

        const recentDatasetsAsText = localStorage.getItem(
          "colplus_recent_datasets"
        );
        let recentDatasets = recentDatasetsAsText
          ? JSON.parse(recentDatasetsAsText)
          : [];
        recentDatasets.unshift(res.data);
        let recentDatasetsFilteredAndMapped = _.uniqBy(recentDatasets, "key")
          .slice(0, 5)
          .map((d) => ({ key: d?.key, title: d?.title, alias: d?.alias }));
        try {
          console.log("Try to set storage 1");
          localStorage.setItem(
            "colplus_recent_datasets",
            JSON.stringify(recentDatasetsFilteredAndMapped)
          );
          setRecentDatasets(recentDatasets);
        } catch (error) {
          console.log("err Try to set storage 1");
          console.log(error);
        }

        setDataset(res.data);
        if (res?.data?.origin === "project") {
          setCatalogue(res.data);
        } else {
          setCatalogue(null);
        }
      })
      .catch((err) => {
        this.setState({ loading: false });

        const recentDatasetsAsText = localStorage.getItem(
          "colplus_recent_datasets"
        );
        let recentDatasets = recentDatasetsAsText
          ? JSON.parse(recentDatasetsAsText)
          : [];
        let recentDatasetsFilteredAndMapped = recentDatasets
          .filter((d) => d.key !== key)
          .map((d) => ({ key: d?.key, title: d?.title, alias: d?.alias }));
        try {
          localStorage.setItem(
            "colplus_recent_datasets",
            JSON.stringify(recentDatasetsFilteredAndMapped)
          );
          console.log("Try to set storage 2");

          localStorage.removeItem("col_selected_dataset");
        } catch (error) {
          console.log("error Try to set storage 2");
          console.log(error);
        }

        // addError(err);
      });
  };

  fetchCatalogue = (key) => {
    const { setDataset, setCatalogue, setSourceDataset, addError } = this.props;
    this.setState({ catalogueLoading: true });
    axios(`${config.dataApi}dataset/${key}`)
      .then((res) => {
        this.setState({ catalogueLoading: false });
        setCatalogue(res.data);
        setSourceDataset(null);
        setDataset(null);
      })
      .catch((err) => {
        this.setState({ catalogueLoading: false });
        addError(err);
      });
  };
  render = () => {
    return null;
  };
}

const mapContextToProps = ({
  catalogue,
  setCatalogue,
  dataset,
  setDataset,
  setSourceDataset,
  setRecentDatasets,
  addError,
}) => ({
  dataset,
  setDataset,
  setSourceDataset,
  addError,
  setRecentDatasets,
  catalogue,
  setCatalogue,
});

export default withContext(mapContextToProps)(withRouter(DatasetProvider));
