import React from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from '@ant-design/icons';
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import {debounce} from 'lodash';
import Highlighter from "react-highlight-words";

const Option = AutoComplete.Option;

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
      `${config.dataApi}nameusage/search?USAGE_ID=${usageId}&DATASET_KEY=${datasetKey}`
    ).then((res) => {
      this.setState({ value: _.get(res, "data.result[0].usage.label") || "" });
    });
  };
  getNames = (q) => {
    const { datasetKey } = this.props;
    const url = datasetKey
      ? `${config.dataApi}dataset/${datasetKey}/nameusage/suggest`
      : `${config.dataApi}name/search`;

    axios(`${url}?vernaculars=false&fuzzy=false&limit=25&q=${q}`)
      .then((res) => {
        const names = res.data.result ? res.data.result.map((name) => ({
            key: name.usage.name.id,
            title: name.usage.name.scientificName,
          })) : res.data.suggestions.map((name) => ({
            key: name.usageId ,
            title: name.suggestion 
          }));
        this.setState({
          names
        });
      })
      .catch((err) => {
        this.setState({ names: [], err });
      });
  };
  onSelectName = (val, obj) => {
    this.setState({ value: val });
    this.props.onSelectName({ key: obj.key, title: val});
  };
  onReset = () => {
    this.setState({ value: "", names: [] });
    this.props.onResetSearch();
  };
  render = () => {
    const { placeHolder, autoFocus } = this.props;
    const { value } = this.state;
    console.log("VALUE: "+value.toString())
    const options = this.state.names.map((o) => {
      return (
        <Option key={o.key} value={o.title}>
           <Highlighter
            highlightStyle={{ fontWeight: "bold", padding: 0 }}
            searchWords={value.split(" ")}
            autoEscape
            textToHighlight={o.title}
          /> 
        </Option>
      );
    });
    const suffix = value ? (
      <CloseCircleOutlined key="suffix" onClick={this.onReset} style={{ marginRight: "6px" }} />
    ) : (
      ""
    );
    // TODO dataSource is deprecated, but options att dont work for custom options, cheildren is used for input
    return (
      <AutoComplete
        dataSource={options}
        style={{ width: "100%" }}
        onSelect={this.onSelectName}
        onSearch={this.getNames}
        placeholder={placeHolder || "Find taxon"}
        onChange={(value) => this.setState({ value })}
        value={value}
        autoFocus={autoFocus === false ? false : true}
      >
        
                      <Input.Search suffix={suffix} />
      </AutoComplete>
    );
  };
}

export default NameSearchAutocomplete;
