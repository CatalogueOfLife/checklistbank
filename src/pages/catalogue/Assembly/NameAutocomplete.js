import React from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";

class NameSearchAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.getNames = debounce(this.getNames, 500);
    this.state = {
      names: [],
      value: "",
    };
  }

  componentDidMount = () => {
    const { defaultTaxonKey } = this.props;
    if (defaultTaxonKey) {
      this.setDefaultValue(defaultTaxonKey);
    }
  };

  componentDidUpdate = (prevProps) => {
    const { defaultTaxonKey } = this.props;
    if (defaultTaxonKey && defaultTaxonKey !== prevProps.defaultTaxonKey) {
      this.setDefaultValue(defaultTaxonKey);
    }
  };

  componentWillUnmount() {
    this.getNames.cancel();
  }

  setDefaultValue = (usageId) => {
    const { datasetKey } = this.props;
    axios(
      `${config.dataApi}nameusage/search?USAGE_ID=${encodeURIComponent(
        usageId
      )}&DATASET_KEY=${datasetKey}`
    )
      .then((res) => {
        this.setState({
          value: _.get(res, "data.result[0].usage.label") || "",
        });
      })
      .catch((err) => {
        this.setState({ value: "" }, () => {
          if (this.props.onError && typeof this.props.onError === "function") {
            this.props.onError(err);
          }
        });
      });
  };
  getNames = (q) => {
    if (!q) {
      return;
    }
    const { datasetKey, minRank, accepted } = this.props;
    const url = datasetKey
      ? `${config.dataApi}dataset/${datasetKey}/nameusage/suggest`
      : `${config.dataApi}name/search`;

    axios(
      `${url}?fuzzy=false&limit=25&q=${encodeURIComponent(q)}${
        minRank ? `&minRank=${minRank}` : ""
      }${accepted ? "&accepted=true":""}`
    )
      .then((res) => {
        this.setState({
          names: res.data.suggestions || [],
        });
      })
      .catch((err) => {
        this.setState({ names: [] }, () => {
          if (this.props.onError && typeof this.props.onError === "function") {
            this.props.onError(err);
          }
        });
      });
  };
  onSelectName = (val, obj) => {
    const selectedTaxon = _.get(obj, "data.acceptedUsageId")
      ? {
          key: _.get(obj, "data.acceptedUsageId"),
          title: _.get(obj, "data.parentOrAcceptedName"),
        }
      : { key: _.get(obj, "data.usageId"), title: _.get(obj, "data.match") };
    this.setState({ value: val });
    this.props.onSelectName(selectedTaxon);
  };
  onReset = () => {
    this.setState({ value: "", names: [] });
    if (typeof this.props.onResetSearch === "function") {
      this.props.onResetSearch();
    }
  };
  render = () => {
    const { placeHolder, autoFocus, disabled = false } = this.props;
    const { value } = this.state;

    const options = this.state.names.map((o) => {
      return {
        key: o.usageId,
        value: o.suggestion,
        label: (
          <Highlighter
            highlightStyle={{ fontWeight: "bold", padding: 0 }}
            searchWords={value.split(" ")}
            autoEscape
            textToHighlight={o.suggestion}
          />
        ),
        data: o,
      };
    });
    const suffix =
      !disabled && value ? (
        <CloseCircleOutlined
          key="suffix"
          onClick={this.onReset}
          style={{ marginRight: "6px" }}
        />
      ) : (
        <span />
      );
    return (
      <AutoComplete
        options={options}
        style={{ width: "100%" }}
        onSelect={this.onSelectName}
        onSearch={this.getNames}
        placeholder={placeHolder || "Find taxon"}
        onChange={(value) => this.setState({ value })}
        value={value}
        autoFocus={autoFocus === false ? false : true}
        disabled={disabled}
      >
        <Input.Search suffix={suffix} />
      </AutoComplete>
    );
  };
}

export default NameSearchAutocomplete;
