import React from "react";
import DecisionTag from "../WorkBench/DecisionTag";
import _ from "lodash";
import Classification from "./Classification";
import { NavLink } from "react-router-dom";
import CopyableColumnText from "../WorkBench/CopyableColumnText";
import { Tooltip, Button } from "antd";
export default (catalogueKey, deleteCallback) => ({
  binomial: [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <Button
            type="link"
            size="small"
            target="_blank"
            key={_.get(record, "id")}
            href={`/dataset/${_.get(record, "datasetKey")}/${
              _.get(record, "bareName") ? "name" : "taxon"
            }/${encodeURIComponent(
              _.get(record, "accepted.id") || _.get(record, "id")
            )}`}
          >
            <Tooltip
              title={_.get(record, "accepted.id") || _.get(record, "id")}
            >
              <div style={{ width: "50px" }} className="truncate">
                {_.get(record, "accepted.id") || _.get(record, "id")}
              </div>
            </Tooltip>
          </Button>
        );
      },
    },
    {
      title: "Decision",
      dataIndex: "decisions",
      key: "decisions",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <DecisionTag
            decision={_.get(record, "decision")}
            catalogueKey={catalogueKey}
            deleteCallback={deleteCallback}
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 60,
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },

    {
      title: "Genus",
      width: 160,
      dataIndex: ["name", "genus"],
      key: "genus",
      className: "workbench-td",
      render: (text, record) => {
        // console.log(text);
        return <CopyableColumnText text={text} width="150px" />;
      },
    },
    {
      title: "specificEpithet",
      width: 160,
      dataIndex: ["name", "specificEpithet"],
      key: "specificEpithet",
      className: "workbench-td",
      render: (text, record) => (
        <CopyableColumnText text={text} width="150px" />
      ),
    },
    {
      title: "Authorship",
      width: 240,
      dataIndex: ["name", "authorship"],
      key: "authorship",
      className: "workbench-td",
      render: (text, record) => (
        <CopyableColumnText text={text} width="230px" />
      ),
    },
    {
      title: "Accepted",
      dataIndex: ["accepted", "labelHtml"],
      key: "accepted",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(record, "accepted.labelHtml"),
            }}
          />
        );
      },
    },

    {
      title: "Rank",
      width: 60,
      dataIndex: ["name", "rank"],
      key: "rank",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },
  ],
  trinomial: [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <Button
            type="link"
            size="small"
            target="_blank"
            key={_.get(record, "id")}
            href={`/dataset/${_.get(record, "datasetKey")}/${
              _.get(record, "bareName") ? "name" : "taxon"
            }/${encodeURIComponent(
              _.get(record, "accepted.id") || _.get(record, "id")
            )}`}
          >
            <Tooltip
              title={_.get(record, "accepted.id") || _.get(record, "id")}
            >
              <div style={{ width: "50px" }} className="truncate">
                {_.get(record, "accepted.id") || _.get(record, "id")}
              </div>
            </Tooltip>
          </Button>
        );
      },
    },
    {
      title: "Decision",
      dataIndex: "decisions",
      key: "decisions",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        // console.log(_.get(record, "decision"));
        return (
          <DecisionTag
            decision={_.get(record, "decision")}
            catalogueKey={catalogueKey}
            deleteCallback={deleteCallback}
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 60,
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },

    {
      title: "Genus",
      width: 160,
      dataIndex: ["name", "genus"],
      key: "genus",
      className: "workbench-td",
      render: (text, record) => (
        <CopyableColumnText text={text} width="150px" />
      ),
    },
    {
      title: "specificEpithet",
      width: 160,
      dataIndex: ["name", "specificEpithet"],
      key: "specificEpithet",
      className: "workbench-td",
      render: (text, record) => (
        <CopyableColumnText text={text} width="150px" />
      ),
    },
    {
      title: "infraspecificEpithet",
      width: 160,
      dataIndex: ["name", "infraspecificEpithet"],
      key: "infraspecificEpithet",
      className: "workbench-td",
      render: (text, record) => (
        <CopyableColumnText text={text} width="150px" />
      ),
    },
    {
      title: "Authorship",
      width: 240,
      dataIndex: ["name", "authorship"],
      key: "authorship",
      className: "workbench-td",
      render: (text, record) => (
        <CopyableColumnText text={text} width="230px" />
      ),
    },
    {
      title: "Accepted",
      dataIndex: ["accepted", "labelHtml"],
      key: "accepted",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(record, "accepted.labelHtml"),
            }}
          />
        );
      },
    },
    {
      title: "Rank",
      width: 60,
      dataIndex: ["name", "rank"],
      key: "rank",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },
  ],
  uninomial: [
    {
      title: "ID",
      dataIndex: ["name", "id"],
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <Button
            type="link"
            size="small"
            target="_blank"
            key={_.get(record, "id")}
            href={`/dataset/${_.get(record, "datasetKey")}/${
              _.get(record, "bareName") ? "name" : "taxon"
            }/${encodeURIComponent(
              _.get(record, "accepted.id") || _.get(record, "id")
            )}`}
          >
            <Tooltip
              title={_.get(record, "accepted.id") || _.get(record, "id")}
            >
              <div style={{ width: "50px" }} className="truncate">
                {_.get(record, "accepted.id") || _.get(record, "id")}
              </div>
            </Tooltip>
          </Button>
        );
      },
    },
    {
      title: "Decision",
      dataIndex: "decisions",
      key: "decisions",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        //  console.log(_.get(record, "decision"));
        return (
          <DecisionTag
            decision={_.get(record, "decision")}
            catalogueKey={catalogueKey}
            deleteCallback={deleteCallback}
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 60,
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },
    /*   {
            title: "Accepted",
            dataIndex: ["accepted", "labelHtml"],
            key: "accepted",
            width: 60,
            className: "workbench-td",
            render: (text, record) => {
            return <span dangerouslySetInnerHTML={{__html: _.get(record, "accepted.labelHtml")}}></span>}
        }, */
    {
      title: "Uninomial",
      width: 160,
      dataIndex: ["name", "uninomial"],
      key: "uninomial",
      className: "workbench-td",
      render: (text, record) => (
        <CopyableColumnText text={text} width="140px" />
      ),
    },

    {
      title: "Authorship",
      width: 240,
      dataIndex: ["name", "authorship"],
      key: "authorship",
      className: "workbench-td",
    },

    {
      title: "Rank",
      width: 60,
      dataIndex: ["name", "rank"],
      key: "rank",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },
    {
      title: "Classification",
      width: 160,
      dataIndex: "classification",
      className: "workbench-td",
      render: (text, record) => {
        return _.get(record, "classification") ? (
          <Classification
            path={_.get(record, "classification")}
            datasetKey={_.get(record, "datasetKey")}
            catalogueKey={catalogueKey}
          />
        ) : (
          ""
        );
      },
    },
  ],
  fullScientificName: [
    {
      title: "ID",
      dataIndex: ["name", "id"],
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <Button
            type="link"
            size="small"
            target="_blank"
            key={_.get(record, "id")}
            href={`/dataset/${_.get(record, "datasetKey")}/${
              _.get(record, "bareName") ? "name" : "taxon"
            }/${encodeURIComponent(
              _.get(record, "accepted.id") || _.get(record, "id")
            )}`}
          >
            <Tooltip
              title={_.get(record, "accepted.id") || _.get(record, "id")}
            >
              <div style={{ width: "50px" }} className="truncate">
                {_.get(record, "accepted.id") || _.get(record, "id")}
              </div>
            </Tooltip>
          </Button>
        );
      },
    },
    {
      title: "Decision",
      dataIndex: "decisions",
      key: "decisions",
      width: 60,
      className: "workbench-td",
      render: (text, record) => {
        //console.log(_.get(record, "decision"));
        return (
          <DecisionTag
            decision={_.get(record, "decision")}
            catalogueKey={catalogueKey}
            deleteCallback={deleteCallback}
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 60,
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },

    {
      title: "scientificName",
      width: 340,
      dataIndex: ["name", "scientificName"],
      key: "scientificName",
      className: "workbench-td",
    },

    {
      title: "Authorship",
      width: 240,
      dataIndex: ["name", "authorship"],
      key: "authorship",
      className: "workbench-td",
    },
    {
      title: "Accepted",
      dataIndex: ["accepted", "labelHtml"],
      key: "accepted",
      width: 340,
      className: "workbench-td",
      render: (text, record) => {
        return (
          <span
            dangerouslySetInnerHTML={{
              __html: _.get(record, "accepted.labelHtml"),
            }}
          ></span>
        );
      },
    },
    {
      title: "Rank",
      width: 60,
      dataIndex: ["name", "rank"],
      key: "rank",
      className: "workbench-td",
      render: (text, record) => <CopyableColumnText text={text} width="50px" />,
    },
    {
      title: "Classification",
      dataIndex: "classification",
      className: "workbench-td",
      render: (text, record) => {
        return _.get(record, "classification") ? (
          <Classification
            path={_.get(record, "classification")}
            maxLength={3}
            datasetKey={_.get(record, "datasetKey")}
            catalogueKey={catalogueKey}
          />
        ) : (
          ""
        );
      },
    },
  ],
});
