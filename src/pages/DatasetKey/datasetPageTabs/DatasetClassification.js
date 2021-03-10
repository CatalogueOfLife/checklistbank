import React from "react";
import _ from "lodash";
import history from "../../../history";
import { Alert } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import PageContent from "../../../components/PageContent";
import ColTree from "../../catalogue/Assembly/ColTree";
import { ColTreeContext } from "../../catalogue/Assembly/ColTreeContext";
import queryString from "query-string";
import Auth from "../../../components/Auth";
import withContext from "../../../components/hoc/withContext";
import NameAutocomplete from "../../catalogue/Assembly/NameAutocomplete";

class DatasetClassification extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  render() {
    const { dataset, location, user, catalogueKey, datasetKey } = this.props;
    const { error } = this.state;
    const params = queryString.parse(this.props.location.search);

    return (
      <PageContent>
        {error && (
          <Alert
            closable
            onClose={() => this.setState({ error: null })}
            style={{ marginBottom: "8px" }}
            message={<ErrorMsg error={error} />}
            type="error"
          />
        )}
        {dataset && (
          <NameAutocomplete
            datasetKey={dataset.key}
            defaultTaxonKey={_.get(params, "taxonKey") || null}
            onError={(error) => this.setState({ error })}
            onSelectName={(name) => {
              history.push({
                pathname: location.pathname,
                search: `?${queryString.stringify({
                  taxonKey: _.get(name, "key"),
                })}`,
              });
              this.treeRef.reloadRoot();
            }}
            onResetSearch={() => {
              history.push({
                pathname: location.pathname,
              });
            }}
          />
        )}
        {dataset && (
          <ColTreeContext.Provider
            value={{
              mode: "readOnly",
              toggleMode: () => {},
              missingTargetKeys: {},
              selectedSourceDatasetKey: dataset.key,
            }}
          >
            <ColTree
              treeRef={(ref) => (this.treeRef = ref)}
              dataset={dataset}
              treeType="readOnly"
              catalogueKey={dataset.key}
              defaultExpandKey={params.taxonKey}
              location={location}
            />
          </ColTreeContext.Provider>
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ user, catalogueKey }) => ({ user, catalogueKey });
export default withContext(mapContextToProps)(DatasetClassification);
