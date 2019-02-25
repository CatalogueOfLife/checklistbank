import React from "react";
import { Col, Row, Tag, Statistic } from "antd";
import _ from "lodash";
import moment from "moment";

const SyncState = ({ syncState }) => (
  <React.Fragment>
    <Row>
      <Col span={6}>
        {!isNaN(_.get(syncState, "completed")) && (
          <Statistic
            title="Syncs completed"
            value={_.get(syncState, "completed")}
          />
        )}
      </Col>
      <Col span={6}>
        {!isNaN(_.get(syncState, "failed")) && (
          <Statistic
            title="Syncs failed"
            value={_.get(syncState, "failed")}
          />
        )}
      </Col>
      <Col span={6}>
        { 
          <Statistic
            title="Syncs in queue"
            value={_.get(syncState, "queued") ? syncState.queued.length : 0}
          />
        }
      </Col>

      <Col span={6}>
        {"boolean" === typeof _.get(syncState, "idle") && (
          <div className="ant-statistic">
            <div className="ant-statistic-title">Status</div>
            <div className="ant-statistic-content">
              <div className="ant-statistic-content-prefix">
                {_.get(syncState, "idle") === false &&
                 _.get(syncState, "running") && (
                    <Tag color="green">
                      {syncState.running.state}
                    </Tag>
                  )}
                {_.get(syncState, "idle") === true && <Tag>idle</Tag>}
              </div>
            </div>
          </div>
        )}
      </Col>
    </Row>
    {_.get(syncState, "running") &&
      <Row>
      <Col span={12}>
        <Statistic title="Taxa created" value={syncState.running.taxonCount} />
      </Col>
      <Col span={12}>
        <Statistic
          title="Sync started"
          value={moment(syncState.running.started).fromNow()}
        />
      </Col>
    </Row>}
  </React.Fragment>
);

export default SyncState;
