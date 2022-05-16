import React from "react";
import { NavLink } from "react-router-dom";
import { Popover, Spin } from "antd";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
import _ from 'lodash'
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

class TaxonSources extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      showInNode: false,
      loading: false,
    };
  }

  componentDidMount = () => {
    const { datasetSectors } = this.props;

    if (Object.keys(datasetSectors).length < 4) {
      this.setState({ showInNode: true }, this.getData);
    }
  };

  getData = () => {
    this.setState({ loading: true });
    const { datasetSectors } = this.props;
    const promises = Object.keys(datasetSectors).map((s) =>
      datasetLoader.load(s).then((dataset) => dataset)
    );

    Promise.all(promises).then((data) => {
      this.setState({ data:_.sortBy(data, ['alias']), loading: false });
    });
  };

  render = () => {
    const { data, showInNode, popOverVisible, loading } = this.state;
    const { taxon, releaseKey } = this.props;

    return showInNode ? (
      <React.Fragment>
        {data.map((d, index) => (
          <span key={index} style={{ fontSize: "11px" }}>
            <NavLink
              to={{
                pathname: releaseKey
                  ? `/dataset/${releaseKey}/source/${d.key}`
                  : `/dataset/${d.key}/about`,
              }}
              exact={true}
            >
              {(index ? ", " : "") + (d.alias || d.key)}
            </NavLink>
          </span>
        ))}
      </React.Fragment>
    ) : (
      <React.Fragment>
        <Popover
          content={
            loading ? (
              <Spin />
            ) : (
              <div style={{ maxWidth: "400px" }}>
                <span>Source databases: </span>
                {data.map((d, index) => (
                  <span style={{ fontSize: "11px" }}>
                    <NavLink
                      to={{
                        pathname: releaseKey
                          ? `/dataset/${releaseKey}/source/${d.key}`
                          : `/dataset/${d.key}/about`,
                      }}
                      exact={true}
                    >
                      {(index ? ", " : "") + (d.alias || d.key)}
                    </NavLink>
                  </span>
                ))}
              </div>
            )
          }
          title={<span dangerouslySetInnerHTML={{ __html: taxon.name }} />}
          visible={popOverVisible}
          onVisibleChange={() =>
            this.setState({ popOverVisible: !popOverVisible })
          }
          trigger="click"
          placement="rightTop"
        >
          <a
            style={{ fontSize: "11px" }}
            href=""
            onClick={() => {
              this.getData();
              this.setState({ popOverVisible: !popOverVisible });
            }}
          >
            Multiple providers
          </a>
        </Popover>
      </React.Fragment>
    );
  };
}

export default TaxonSources;
