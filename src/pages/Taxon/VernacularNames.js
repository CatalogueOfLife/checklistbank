import React from "react";
import { Table } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";

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

    const newData = data.map(this.decorateWithCountryByCode)
    this.setState({data: newData})
    Promise.all(
      data.map(this.decorateWithLanguageByCode)
      )
      .then(() => this.setState({data: [...this.state.data]}))

  }

  decorateWithCountryByCode = (name) => {
    const { countryAlpha3, countryAlpha2 } = this.props;

    if(name.country && name.country.length === 2){
      return {...name, countryTitle: countryAlpha2[name.country].title}
    } else if(name.country && name.country.length === 3){
      return {...name, countryTitle: countryAlpha3[name.country].title}
    } else {
      return name;
    }
  }

  decorateWithLanguageByCode = (name) => {
  return !name.language ? Promise.resolve() : axios(
      `${config.dataApi}/vocab/language/${name.language}`
    )
      .then(res => {
        name.languageName = res.data
      })
      .catch(error => console.log(err))
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

const mapContextToProps = ({ countryAlpha3, countryAlpha2 }) => ({ countryAlpha3, countryAlpha2 });

export default withContext(mapContextToProps)(VernacularNamesTable);

