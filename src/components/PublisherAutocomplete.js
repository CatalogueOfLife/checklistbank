import React from "react";
import axios from "axios";
import config from "../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";
import { truncate } from "./util";

const axiosNoAuth = axios.create({ headers: { Authorization: null } });
/* function truncate(str, n){
  return (str?.length > n) ? str.substr(0, n-1) + '...' : str;
}; */

class PublisherAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.getPublishers = debounce(this.getPublishers, 500);

    this.state = {
      publishers: [],
      value: "",
    };
  }

  componentDidMount = () => {
    const { defaultPublisherKey } = this.props;
    if (defaultPublisherKey) {
      this.setDefaultValue(defaultPublisherKey);
    }
  };

  componentDidUpdate = (prevProps) => {
    const { defaultPublisherKey } = this.props;
    if (
      defaultPublisherKey &&
      defaultPublisherKey !== prevProps.defaultPublisherKey
    ) {
      this.setDefaultValue(defaultPublisherKey);
    } else if (prevProps.defaultPublisherKey && !defaultPublisherKey) {
      this.setState({ value: "" });
    }
  };

  componentWillUnmount() {
    this.getPublishers.cancel();
  }

  setDefaultValue = (defaultPublisherKey) => {
    axiosNoAuth(`${config.gbifApi}organization/${defaultPublisherKey}`)
      .then((res) => {
        let o = res.data;
        this.setState({
          value: `${o.alias || truncate(o.title, 25)} ${o.version || ""} [${
            o.key
          }]`,
        });
        this.props.onSelectPublisher(res.data);
      })
      .catch((error) => {
        if (typeof this.props.onError === "function") {
          this.props.onError(error);
        }
      });
  };

  getPublishers = (q) => {
    axiosNoAuth(
      `${config.gbifApi}organization?q=${encodeURIComponent(q)}&limit=30`
    )
      .then((res) => {
        this.setState({ publishers: res.data.results });
      })
      .catch((err) => {
        if (typeof this.props.onError === "function") {
          this.props.onError(er);
        }
        this.setState({ publishers: [], err });
      });
  };
  onSelectPublisher = (val, obj) => {
    this.setState({ value: val });
    this.props.onSelectPublisher({ key: obj.key, title: obj.title });
  };
  onReset = () => {
    this.setState({ value: "", publishers: [] });
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
    const options = this.state.publishers
      ? this.state.publishers.map((o) => {
          const text = `${o.alias || truncate(o.title, 25)} ${
            o.version || ""
          } [${o.key}]`;
          return {
            key: o.key,
            title: o.title,
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
        onSelect={this.onSelectPublisher}
        onSearch={this.getPublishers}
        options={options}
        placeholder={this.props.placeHolder || "Find publisher"}
        style={style ? style : { width: "100%" }}
        onChange={(value) => this.setState({ value })}
        value={value}
        autoFocus={autoFocus === false ? false : true}
        disabled={this.props.disabled}
      >
        <Input.Search suffix={suffix} />
      </AutoComplete>
    );
  };
}

export default PublisherAutocomplete;
