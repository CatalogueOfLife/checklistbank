import React from "react";
import axios from "axios";
import config from "../../../config";
import { CloseCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import _ from "lodash";
import { debounce } from "lodash";
import Highlighter from "react-highlight-words";

class UserAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.getUsers = debounce(this.getUsers, 500);

    this.state = {
      users: [],
      value: "",
    };
  }

  componentDidMount = () => {
    const { defaultUserName } = this.props;
    if (defaultUserName) {
      this.setDefaultValue(defaultUserName);
    }
  };

  componentDidUpdate = (prevProps) => {
    const { defaultUserName } = this.props;
    if (defaultUserName && defaultUserName !== prevProps.defaultUserName) {
      this.setDefaultValue(defaultUserName);
    } else if (prevProps.defaultUserName && !defaultUserName) {
      this.setState({ value: "" });
    }
  };

  componentWillUnmount() {
    this.getUsers.cancel();
  }

  setDefaultValue = (defaultUserName) => {
    axios(`${config.dataApi}user/${defaultUserName}`).then((res) => {
      this.setState({ value: _.get(res, "data.title") || "" });
      this.props.onSelectUser(res.data);
    });
  };

  getUsers = (q) => {
    axios(`${config.dataApi}user?q=${encodeURIComponent(q)}&limit=30`)
      .then((res) => {
        this.setState({ users: res.data.result });
      })
      .catch((err) => {
        this.setState({ users: [], err });
      });
  };
  onSelectUser = (val, obj) => {
    this.setState({ value: val });
    this.props.onSelectUser({ key: obj.key, title: val });
  };
  onReset = () => {
    this.setState({ value: "", users: [] });
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
    const options = this.state.users
      ? this.state.users.map((o) => {
          const text = !o.firstname && !o.lastname ? o.username : `${o.firstname} ${o.lastname} (${o.username})`;
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
        onSelect={this.onSelectUser}
        onSearch={this.getUsers}
        options={options}
        placeholder={this.props.placeHolder || "Find user"}
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

export default UserAutocomplete;
