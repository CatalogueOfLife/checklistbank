import React from "react";
import { Table } from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import withContext from "../../components/hoc/withContext";
import ReferencePopover from "../catalogue/CatalogueReferences/ReferencePopover";

class VernacularNamesTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: this.props.data ? [...this.props.data] : [],
      columns: [
        {
          title: "Original name",
          dataIndex: "name",
          key: "name",
          width: 150,
        },
        {
          title: "Transliterated name",
          dataIndex: "latin",
          key: "latin",
          width: 150,
        },
        {
          title: "Language",
          dataIndex: "language",
          key: "language",
          width: 150,
          render: (text, record) =>
            record.languageName ? record.languageName : text,
        },
        {
          title: "Country of use",
          dataIndex: "country",
          key: "country",
          width: 150,
          render: (text, record) =>
            record.countryTitle ? record.countryTitle : text,
        },
        {
          title: "",
          dataIndex: "referenceId",
          key: "referenceId",

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
      ],
    };
  }
  componentDidMount = () => {
    const { data } = this.props;

    const newData = data.map(this.decorateWithCountryByCode);
    this.setState({ data: newData });
    Promise.all(newData.map(this.decorateWithLanguageByCode)).then(() =>
      this.setState({ data: [...this.state.data] })
    );
  };

  decorateWithCountryByCode = (name) => {
    const { countryAlpha3, countryAlpha2 } = this.props;

    if (countryAlpha2 && name.country && name.country.length === 2) {
      return {
        ...name,
        countryTitle: _.get(countryAlpha2, `[${name.country}].title`) || "",
      };
    } else if (countryAlpha3 && name.country && name.country.length === 3) {
      return {
        ...name,
        countryTitle: _.get(countryAlpha3, `[${name.country}].title`) || "",
      };
    } else {
      return name;
    }
  };

  decorateWithLanguageByCode = (name) => {
    return !name.language
      ? Promise.resolve()
      : axios(`${config.dataApi}vocab/language/${name.language}`)
          .then((res) => {
            name.languageName = res.data;
          })
          .catch((error) => console.log(error));
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

const mapContextToProps = ({ countryAlpha3, countryAlpha2 }) => ({
  countryAlpha3,
  countryAlpha2,
});

export default withContext(mapContextToProps)(VernacularNamesTable);
