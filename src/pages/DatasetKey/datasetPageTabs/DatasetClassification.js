import { useRef, useState } from "react";
import _ from "lodash";
import history from "../../../history";
import { Alert, Row, Col, Switch } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import PageContent from "../../../components/PageContent";
import ColTree from "../../project/Assembly/ColTree";
import { ColTreeContext } from "../../project/Assembly/ColTreeContext";
import queryString from "query-string";
import withContext from "../../../components/hoc/withContext";
import NameAutocomplete from "../../project/Assembly/NameAutocomplete";

const DatasetClassification = ({ dataset, location }) => {
  const [error, setError] = useState(null);
  const [insertPlaceholder, setInsertPlaceholder] = useState(false);
  const treeRef = useRef(null);

  const params = queryString.parse(location.search);

  return (
    <PageContent>
      {error && (
        <Alert
          closable={{ onClose: () => setError(null) }}
          style={{ marginBottom: "8px" }}
          description={<ErrorMsg error={error} />}
          type="error"
        />
      )}
      {dataset && (
        <Row><Col span={12}>
        <NameAutocomplete
          datasetKey={dataset.key}
          defaultTaxonKey={_.get(params, "taxonKey") || null}
          onError={(error) => setError(error)}
          onSelectName={(name) => {
            history.push({
              pathname: location.pathname,
              search: `?${queryString.stringify({
                taxonKey: _.get(name, "key"),
              })}`,
            });
            treeRef.current.reloadRoot();
          }}
          onResetSearch={() => {
            history.push({
              pathname: location.pathname,
            });
          }}
        />
        </Col>
        <Col flex="auto"></Col>
        <Col>
              <Switch
                onChange={(checked) =>
                  setInsertPlaceholder(checked)
                }
                checkedChildren={"Show placeholder ranks"}
                unCheckedChildren={"Show placeholder ranks"}
              />
            </Col></Row>

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
            treeRef={(ref) => (treeRef.current = ref)}
            dataset={dataset}
            treeType="readOnly"
            projectKey={dataset.key}
            defaultExpandKey={params.taxonKey}
            location={location}
            insertPlaceholder={insertPlaceholder}

          />
        </ColTreeContext.Provider>
      )}
    </PageContent>
  );
};

const mapContextToProps = ({ user, projectKey }) => ({ user, projectKey });
export default withContext(mapContextToProps)(DatasetClassification);
