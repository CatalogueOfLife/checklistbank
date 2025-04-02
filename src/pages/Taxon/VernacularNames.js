import React from "react";
import { Table } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";
import MergedDataBadge from "../../components/MergedDataBadge";

class VernacularNamesTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: this.props.data ? [...this.props.data] : [],
      columns: [
        {
          title: "",
          dataIndex: "merged",
          key: "merged",
          width: 12,
          render: (text, record) =>
            record?.merged ? <MergedDataBadge /> : "",
        },
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
          width: 200,
        },
        {
          title: "Transliteration",
          dataIndex: "latin",
          key: "latin",
          width: 200,
        },
        {
          title: "Language",
          dataIndex: "language",
          key: "language",
          width: 100,
          render: (text, record) =>
            record.languageTitle ? record.languageTitle : text,
        },
        {
          title: "Country",
          dataIndex: "country",
          key: "country",
          width: 70,
          render: (text, record) =>
            record.countryTitle ? record.countryTitle : text,
        },
        {
          title: "Ref",
          dataIndex: "referenceId",
          key: "referenceId",
          width: 30,

          render: (text, record) => {
            return text ? (
              <ReferencePopover
                referenceId={text}
                datasetKey={this.props.datasetKey}
                placement="left"
              ></ReferencePopover>
            ) : (
              ""
            );
          },
        },
        {
          title: "Remarks",
          dataIndex: "remarks",
          key: "remarks",
        },
      ],
    };
  }
  componentDidMount = () => {
    const { data } = this.props;

    const newData = data.map(this.decorateWithCountryByCode);
    this.setState({ data: newData });
    console.log(newData);
  };

  decorateWithCountryByCode = (name) => {
    const { countryAlpha3, countryAlpha2, language } = this.props;

    var countryName = name.country;
    var languageName = name.language;

    
    if (name.country) {
      if (countryAlpha2 && name.country.length === 2) {
        countryName = _.get(countryAlpha2, `[${name.country}].title`) || name.country;
      } else if (countryAlpha3 && name.country.length === 3) {
        countryName = _.get(countryAlpha3, `[${name.country}].title`) || name.country;
      }  
    }
    if (language && name.language) {
      languageName = _.get(language, `[${name.language}]`) || name.language;
    }

    return {
      ...name,
      countryTitle: countryName,
      languageTitle: languageName,
    };
  };
  
  render() {
    const { style } = this.props;
    const { data, columns } = this.state;

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

const mapContextToProps = ({ countryAlpha3, countryAlpha2, language }) => ({
  countryAlpha3,
  countryAlpha2,
  language,
});

export default withContext(mapContextToProps)(VernacularNamesTable);
