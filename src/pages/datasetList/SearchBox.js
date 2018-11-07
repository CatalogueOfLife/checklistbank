import React from "react";
import { Input, Icon } from "antd";

const Search = Input.Search;

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.resetSearch = this.resetSearch.bind(this);
    this.state = {
      search: ""
    };
  }
  componentWillMount = () => {
    if (this.props.defaultValue) {
      this.setState({ search: this.props.defaultValue });
    }
  };
  resetSearch() {
    this.setState({ search: "" }, () => {
      this.props.onSearch(this.state.search);
    });
  }
  render = () => {
    const suffix = this.state.search ? (
      <Icon
        type="close-circle"
        key="suffix"
        style={{ marginRight: "6px" }}
        onClick={this.resetSearch}
      />
    ) : null;

    return (
      <Search
        placeholder="input search text"
        value={this.state.search}
        onSearch={value => this.props.onSearch(this.state.search)}
        onChange={event => this.setState({ search: event.target.value })}
        enterButton
        suffix={suffix}
        style={{ marginBottom: "10px", width: "50%" }}
      />
    );
  };
}

export default SearchBox;
