import { useState, useEffect } from "react";
import axios from "axios";
import _ from "lodash";
import { Alert, App } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import PageContent from "../../../components/PageContent";
import config from "../../../config";
import SectorTable from "../../project/ProjectSectors/SectorTable";
import withContext from "../../../components/hoc/withContext";
import qs from "query-string";
import history from "../../../history";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

const PAGE_SIZE = 500;

const DatasetSectors = ({ dataset, projectKey, location }) => {
  const { notification } = App.useApp();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
    showQuickJumper: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncAllError, setSyncAllError] = useState(null);

  const decorateWithCatalogue = (res) => {
    if (!res.data.result) return res;
    return Promise.all(
      res.data.result.map((sector) =>
        datasetLoader
          .load(sector.datasetKey)
          .then((ds) => (sector.dataset = ds))
      )
    ).then(() => res);
  };

  const getData = (ds, params) => {
    setLoading(true);
    axios(
      `${config.dataApi}dataset/${ds.key}/sector?${qs.stringify({
        ...params,
        subject: true,
      })}`
    )
      .then(decorateWithCatalogue)
      .then((res) => {
        setLoading(false);
        setData(res.data.result || []);
        setPagination((prev) => ({
          ...prev,
          total: _.get(res, "data.total"),
        }));
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err);
        setData([]);
      });
  };

  const init = (ds, locationSearch, locationPathname) => {
    let params = qs.parse(locationSearch);
    if (_.isEmpty(params)) {
      params = { limit: PAGE_SIZE, offset: 0 };
      history.push({
        pathname: locationPathname,
        search: `?limit=${PAGE_SIZE}&offset=0`,
      });
    }

    const newPagination = {
      pageSize: PAGE_SIZE,
      current: Number(params.offset) / Number(params.limit) + 1,
    };
    setPagination((prev) => ({ ...prev, ...newPagination }));
    getData(ds, params);
  };

  useEffect(() => {
    if (dataset && data.length === 0) {
      init(dataset, _.get({ search: location?.search }, "search"), location?.pathname);
    }
  }, []);

  useEffect(() => {
    if (dataset) {
      init(dataset, location?.search, location?.pathname);
    }
  }, [location?.search, dataset?.key]);

  const onDeleteSector = (sector) => {
    axios
      .delete(`${config.dataApi}dataset/${projectKey}/sector/${sector.id}`)
      .then(() => {
        notification.open({
          message: "Deletion triggered",
          description: `Delete job for ${sector.key} placed on the sync queue`,
        });
        setData((prev) => prev.filter((d) => d.key !== sector.key));
      })
      .catch((err) => {
        setError(err);
      });
  };

  const handleTableChange = (newPagination) => {
    const pager = { ...pagination, ...newPagination };
    const params = {
      ...qs.parse(location?.search),
      limit: pager.pageSize,
      offset: (pager.current - 1) * pager.pageSize,
    };

    history.push({
      pathname: location?.pathname,
      search: qs.stringify(params),
    });
  };

  return (
    <PageContent>
      {error && <Alert description={<ErrorMsg error={error} />} type="error" />}
      {syncAllError && (
        <Alert description={<ErrorMsg error={syncAllError} />} type="error" />
      )}
      {!loading && data.length === 0 ? (
        <h4>No sectors configured</h4>
      ) : (
        <>
          {!error && (
            <SectorTable
              data={data}
              loading={loading}
              onDeleteSector={onDeleteSector}
              handleTableChange={handleTableChange}
              pagination={pagination}
            />
          )}
        </>
      )}
    </PageContent>
  );
};

const mapContextToProps = ({ projectKey }) => ({ projectKey });

export default withContext(mapContextToProps)(DatasetSectors);
