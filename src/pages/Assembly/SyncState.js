import React from "react";
import { Col, Row, Tag, Statistic } from "antd";
import _ from "lodash";
import moment from "moment";

const SyncState = ({ syncState }) => (
  <React.Fragment>
    <Row>
      <Col span={6}>
        {!isNaN(_.get(syncState, "syncsCompleted")) && (
          <Statistic
            title="Syncs completed"
            value={_.get(syncState, "syncsCompleted")}
          />
        )}
      </Col>
      <Col span={6}>
        {!isNaN(_.get(syncState, "syncsFailed")) && (
          <Statistic
            title="Syncs failed"
            value={_.get(syncState, "syncsFailed")}
          />
        )}
      </Col>
      <Col span={6}>
        {_.get(syncState, "syncsRunning") && (
          <Statistic
            title="Syncs in queue"
            value={syncState.syncsRunning.filter(s => !s.status).length}
          />
        )}
      </Col>

      <Col span={6}>
        {"boolean" === typeof _.get(syncState, "idle") && (
          <div className="ant-statistic">
            <div className="ant-statistic-title">Status</div>
            <div className="ant-statistic-content">
              <div className="ant-statistic-content-prefix">
                {_.get(syncState, "idle") === false &&
                  _.find(_.get(syncState, "syncsRunning"), s => !!s.status) && (
                    <Tag color="green">
                      {_.find(syncState.syncsRunning, s => !!s.status).status}
                    </Tag>
                  )}
                {_.get(syncState, "idle") === true && <Tag>idle</Tag>}
              </div>
            </div>
          </div>
        )}
      </Col>
    </Row>
    {_.get(syncState, "syncsRunning") &&
      _.get(syncState, "syncsRunning.length") > 0 &&
      _.get(syncState, "syncsRunning")
        .filter(s => !!s.status)
        .map(s => (
          <Row>
            <Col span={12}>
              <Statistic title="Taxa created" value={s.taxaCreated} />
            </Col>
            <Col span={12}>
              <Statistic
                title="Sync started"
                value={moment(s.started).fromNow()}
              />
            </Col>
          </Row>
        ))}
  </React.Fragment>
);

export default SyncState;
