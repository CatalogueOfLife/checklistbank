import React from "react";
import { Table } from "antd";
import _ from "lodash";
import { NavLink } from "react-router-dom";


class SynonymsTable extends React.Component {
  componentWillMount() {
    let synonyms = this.props.data.map( s => {
      return s[0] ? s[0] : s.name;
    });
    const { datasetKey } = this.props;

    this.setState({ synonyms,  columns : [
      {
        title: "scientificName",
        dataIndex: "scientificName",
        key: "scientificName",
        render: (text, record) => {
          return (
            <NavLink to={{ pathname: `/dataset/${datasetKey}/name/${record.id}` }} exact={true}>
              {text}
            </NavLink>
          );
        },
      },
      {
        title: "authorship",
        dataIndex: "authorship",
        key: "authorship"
      }
    ]});
  }

  render() {
    const { synonyms, columns } = this.state;
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
