import React from "react";
import { Table } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";

const columns = [
  {
    title: "name",
    dataIndex: "name",
    key: "name"
  },
  {
    title: "latin",
    dataIndex: "latin",
    key: "latin"
  },
  {
    title: "language",
    dataIndex: "language",
    key: "language",
    render: (text, record) => record.languageName ?  record.languageName : text
    
  },
  {
    title: "country",
    dataIndex: "country",
    key: "country"
  }
];

class VernacularNamesTable extends React.Component {
  
  constructor(props) {
    super(props);

    this.state = {
      data: this.props.data ? [...this.props.data] : []
    };
  }
  componentWillMount = () => {
    const {data} = this.props;

    Promise.all(
      data.map(n => this.decorateWithLanguageByCode)
      )
      .then(() => this.setState({data: [...this.state.data]}))

  }
  decorateWithLanguageByCode = (name) => {
  return axios(
      `${config.dataApi}/vocab/language/${name.language}`
    )
      .then(res => {
        name.languageName = res.data
      })
  }
  render() {
    const { data, style } = this.props;

    
    return (
      <Table
        style={style}
        className="colplus-taxon-page-list"
        columns={columns}
        dataSource={data}
        rowKey="verbatimKey"
        pagination={false}
        size="middle"
      />
    );
  }
}

export default VernacularNamesTable;
