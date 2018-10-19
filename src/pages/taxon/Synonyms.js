import React from "react";
import { Table } from "antd";
import _ from "lodash";

const columns = [
  {
    title: "scientificName",
    dataIndex: "scientificName",
    key: "scientificName"
  },
  {
    title: "authorship",
    dataIndex: "authorship",
    key: "authorship"
  }
];

class SynonymsTable extends React.Component {
  componentWillMount() {
    let synonyms = _.map(this.props.data, s => {
      return s[0] ? s[0] : s.name;
    });
    this.setState({ synonyms });
  }

  render() {
    const { synonyms } = this.state;
    return (
      <Table
        columns={columns}
        dataSource={synonyms}
        rowKey="id"
        pagination={false}
        showHeader={false}
        size="small"
      />
    );
  }
}

export default SynonymsTable;
