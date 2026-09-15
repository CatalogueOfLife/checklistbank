import { useEffect, useState } from "react";
import axios from "axios";
import {
  App,
  Col,
  Empty,
  Form,
  Pagination,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import DataLoader from "dataloader";
import qs from "query-string";
import _ from "lodash";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";
import withRouter from "../../../withRouter";
import history from "../../../history";
import config from "../../../config";
import { getDatasetsBatch } from "../../../api/dataset";
import { getUsersBatch } from "../../../api/user";
import SectorTabs from "../ProjectSectors/SectorTabs";
import SectorTable from "../ProjectSectors/SectorTable";
import SectorForm from "../Assembly/SectorForm";
import DatasetAutocomplete from "../Assembly/DatasetAutocomplete";

const { Text, Title, Paragraph } = Typography;
const FormItem = Form.Item;
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));
const userLoader = new DataLoader((ids) => getUsersBatch(ids));

// the page counts groups of sectors, not sectors
const PAGE_SIZE = 20;

// sector properties that tell apart sectors sharing a subject, rendered verbatim
const FILTER_PROPS = [
  "priority",
  "placeholderRank",
  "ranks",
  "entities",
  "nameTypes",
  "nameStatusExclusion",
  "extinctFilter",
  "code",
];

const filterColumn = {
  title: "Filters",
  key: "filters",
  width: 250,
  render: (text, record) =>
    FILTER_PROPS.filter(
      (p) => !_.isNil(record?.[p]) && !(_.isArray(record[p]) && record[p].length === 0)
    ).map((p) => (
      <Tag key={p} style={{ marginBottom: "4px", whiteSpace: "normal" }}>
        {p}: {_.isArray(record[p]) ? record[p].join(", ") : String(record[p])}
      </Tag>
    )),
};

const SectorDuplicates = ({ projectKey, location, addError }) => {
  const { notification } = App.useApp();
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const params = qs.parse(location?.search);
  const limit = Number(params.limit) || PAGE_SIZE;
  const offset = Number(params.offset) || 0;

  const getData = async () => {
    setLoading(true);
    try {
      const res = await axios(
        `${config.dataApi}dataset/${projectKey}/sector/duplicate?${qs.stringify({
          ...params,
          limit,
          offset,
        })}`
      );
      const result = res?.data?.result || [];
      await Promise.all(
        result.flatMap((group) =>
          group.sectors.flatMap((sector) => [
            datasetLoader
              .load(sector.subjectDatasetKey)
              .then((dataset) => (sector.dataset = dataset)),
            userLoader
              .load(sector.createdBy)
              .then((user) => (sector.user = user)),
          ])
        )
      );
      setGroups(result);
      setTotal(res?.data?.total || 0);
    } catch (err) {
      addError(err);
      setGroups([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (projectKey) {
      getData();
    }
  }, [projectKey, location?.search]);

  const updateSearch = (newParams) => {
    const updatedParams = { ...params, ...newParams, offset: 0 };
    Object.keys(newParams).forEach((param) => {
      if (_.isNil(newParams[param]) || _.isEmpty(String(newParams[param]))) {
        delete updatedParams[param];
      }
    });
    history.push({
      pathname: location.pathname,
      search: qs.stringify(updatedParams),
    });
  };

  const onDeleteSector = (sector, partial = false) => {
    axios
      .delete(
        `${config.dataApi}dataset/${projectKey}/sector/${sector.id}?partial=${partial}`
      )
      .then(() => {
        notification.open({
          message: "Deletion triggered",
          description: `${partial ? "Partial" : "Full"} delete job for ${
            sector.id
          } placed on the sync queue`,
        });
        setGroups((prev) =>
          prev
            .map((group) => ({
              ...group,
              sectors: group.sectors.filter((s) => s.id !== sector.id),
            }))
            .filter((group) => group.sectors.length > 0)
        );
      })
      .catch((err) => addError(err));
  };

  const groupTitle = (group) => {
    const sector = group.sectors[0];
    return (
      <>
        {sector?.dataset?.alias || sector?.dataset?.title || group.subjectDatasetKey}
        {" · "}
        {group.subjectId ? (
          <>
            {sector?.subject?.rank && (
              <Text type="secondary">{sector.subject.rank}: </Text>
            )}
            {sector?.subject?.name || group.subjectId}
          </>
        ) : (
          <Text type="secondary">no subject</Text>
        )}{" "}
        <Tag>{group.sectors.length} sectors</Tag>
      </>
    );
  };

  return (
    <Layout
      selectedKeys={["projectSectors"]}
      openKeys={["assembly"]}
      title="Sector duplicates"
    >
      <PageContent>
        <SectorTabs />
        <Paragraph type="secondary">
          Sectors sharing the same subject. Subject less sectors from the same
          source share their missing subject. Filters apply before duplicates
          are detected.
        </Paragraph>
        <Form layout="inline">
          <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
            <DatasetAutocomplete
              defaultDatasetKey={params.subjectDatasetKey || null}
              onResetSearch={() => updateSearch({ subjectDatasetKey: null })}
              onSelectDataset={(dataset) =>
                updateSearch({ subjectDatasetKey: dataset.key })
              }
              contributesTo={projectKey}
              placeHolder="Source dataset"
            />
          </FormItem>
          <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
            <Select
              placeholder="Sector mode"
              style={{ width: 200 }}
              value={params.mode ? [].concat(params.mode) : undefined}
              mode="multiple"
              allowClear
              onChange={(value) => updateSearch({ mode: value })}
              options={["attach", "union", "merge", "hierarchy"].map((m) => ({
                value: m,
                label: m,
              }))}
            />
          </FormItem>
        </Form>
        <Spin spinning={loading}>
          {!loading && groups.length === 0 && (
            <Empty description="No sectors share a subject" />
          )}
          {groups.map((group) => (
            <div
              key={`${group.subjectDatasetKey}-${group.subjectId}`}
              style={{ marginTop: "16px" }}
            >
              <Title level={5}>{groupTitle(group)}</Title>
              <SectorTable
                data={group.sectors}
                pagination={false}
                onSectorRematch={getData}
                onDeleteSector={onDeleteSector}
                extraColumns={[filterColumn]}
                expandable={{
                  expandedRowRender: (record) => (
                    <Row>
                      <Col flex="auto"></Col>
                      <Col style={{ width: "500px" }}>
                        <SectorForm sector={record} onSubmit={getData} />
                      </Col>
                      <Col flex="auto"></Col>
                    </Row>
                  ),
                }}
              />
            </div>
          ))}
        </Spin>
        {total > limit && (
          <Row justify="end" style={{ marginTop: "16px" }}>
            <Pagination
              current={offset / limit + 1}
              pageSize={limit}
              total={total}
              showSizeChanger={false}
              showTotal={(t) => `${t.toLocaleString("en-GB")} groups`}
              onChange={(page) =>
                history.push({
                  pathname: location.pathname,
                  search: qs.stringify({
                    ...params,
                    limit,
                    offset: (page - 1) * limit,
                  }),
                })
              }
            />
          </Row>
        )}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ projectKey, addError }) => ({
  projectKey,
  addError,
});

export default withContext(mapContextToProps)(withRouter(SectorDuplicates));
