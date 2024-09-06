import React from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";
import { truncate } from "../../../components/util";

/* function truncate(str, n){
  return (str?.length > n) ? str.substr(0, n-1) + '...' : str;
}; */

class DatasetAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.getDatasets = debounce(this.getDatasets, 500);

    this.state = {
      datasets: [],
      value: "",
    };
  }

  componentDidMount = () => {
    const { defaultDatasetKey } = this.props;
    if (defaultDatasetKey) {
      this.setDefaultValue(defaultDatasetKey);
    }
  };

  componentDidUpdate = (prevProps) => {
    const { defaultDatasetKey } = this.props;
    if (
      defaultDatasetKey &&
      defaultDatasetKey !== prevProps.defaultDatasetKey
    ) {
      this.setDefaultValue(defaultDatasetKey);
    } else if (prevProps.defaultDatasetKey && !defaultDatasetKey) {
      this.setState({ value: "" });
    }
  };

  componentWillUnmount() {
    this.getDatasets.cancel();
  }

  setDefaultValue = (defaultDatasetKey) => {
    axios(`${config.dataApi}dataset/${defaultDatasetKey}`)
      .then((res) => {
        let o = res.data;
        this.setState({
          value: `${o.alias || truncate(o.title, 25)} ${o.version || ""} [${
            o.key
          }]`,
        });
        this.props.onSelectDataset(res.data);
      })
      .catch((error) => {
        if (typeof this.props.onError === "function") {
          this.props.onError(error);
        }
      });
  };

  getDatasets = (q) => {
    const { contributesTo, origin, minSize, merge = true } = this.props;

    const url = !!contributesTo
      ? `${
          config.dataApi
        }dataset/${contributesTo}/source/suggest?merge=${merge}&q=${encodeURIComponent(
          q
        )}`
      : `${config.dataApi}dataset?q=${encodeURIComponent(q)}&limit=30${
          origin ? "&origin=" + origin : ""
        }${minSize ? "&minSize=" + minSize : ""}`;
    axios(url)
      .then((res) => {
        this.setState({ datasets: res.data.result || res.data });
      })
      .catch((err) => {
        if (typeof this.props.onError === "function") {
          this.props.onError(err);
        }
        this.setState({ datasets: [], err });
      });
  };
  onSelectDataset = (val, obj) => {
    this.setState({ value: val });
    console.log(obj?.data);
    this.props.onSelectDataset({ key: obj.key, title: val, data: obj?.data });
  };
  onReset = () => {
    this.setState({ value: "", datasets: [] });
    if (
      this.props.onResetSearch &&
      typeof this.props.onResetSearch === "function"
    ) {
      this.props.onResetSearch();
    }
  };
  render = () => {
    const { value } = this.state;
    const { style, autoFocus } = this.props;

    const suffix = value ? (
      <CloseCircleOutlined
        key="suffix"
        onClick={this.onReset}
        style={{ marginRight: "6px" }}
      />
    ) : (
      <span />
    );
    const options = this.state.datasets
      ? this.state.datasets.map((o) => {
          const text = `${o.alias || truncate(o.title, 25)} ${
            o.version || ""
          } [${o.key}]`;
          return {
            key: o.key,
            value: text,
            label: (
              <Highlighter
                highlightStyle={{ fontWeight: "bold", padding: 0 }}
                searchWords={value.split(" ")}
                autoEscape
                textToHighlight={text}
              />
            ),
            data: o,
          };
        })
      : [];

    return (
      <AutoComplete
        onSelect={this.onSelectDataset}
        onSearch={this.getDatasets}
        options={options}
        placeholder={this.props.placeHolder || "Find dataset"}
        style={style ? style : { width: "100%" }}
        onChange={(value) => this.setState({ value })}
        value={value}
        autoFocus={autoFocus === false ? false : true}
      >
        <Input.Search suffix={suffix} />
      </AutoComplete>
    );
  };
}

export default DatasetAutocomplete;
