import React, { useState } from "react";

import { notification, Select, Row, Col, Button, Input } from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";

import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import NameAutocomplete from "./NameAutocomplete";
import SectorNote from "./SectorNote";
import withContext from "../../../components/hoc/withContext";

const { Option } = Select;

const SectorForm = ({
  sector,
  nomCode,
  entitytype,
  sectorDatasetRanks,
  rank,
  onError,
}) => {
  const [subjectDisabled, setSubjectDisabled] = useState(true);
  const [targetDisabled, setTargetDisabled] = useState(true);

  const updateSectorCode = (code) => {
    axios
      .put(
        `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
        { ...sector, code: code }
      )
      .then(() => {
        sector.code = code;
        notification.open({
          message: "Nom. code for sector updated",
          description: `New code is ${code}`,
        });
      })
      .catch((err) => {
        if (typeof onError === "function") {
          onError(err);
        }
      });
  };

  const updateTargetOrSubject = (obj, targetOrSubject) => {
    axios
      .put(
        `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
        { ...sector, [targetOrSubject]: { id: obj.key, name: obj.title } }
      )
      .then(() => {
        notification.open({
          message: `${targetOrSubject} updated, please refresh tree`,
        });
      })
      .catch((err) => {
        if (typeof onError === "function") {
          onError(err);
        }
      });
  };

  const updateSectorRank = (ranks) => {
    axios
      .put(
        `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
        { ...sector, ranks: ranks }
      )
      .then(() => {
        sector.ranks = ranks;
        notification.open({
          message: "Ranks for sector configured",
        });
      })
      .catch((err) => {
        if (typeof onError === "function") {
          onError(err);
        }
      });
  };

  const updatePlaceholderRank = (rank) => {
    axios
      .put(
        `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
        { ...sector, placeholderRank: rank }
      )
      .then(() => {
        sector.placeholderRank = rank;
        notification.open({
          message: "Placeholder rank for sector configured",
        });
      })
      .catch((err) => {
        if (typeof onError === "function") {
          onError(err);
        }
      });
  };

  const updateSectorNote = (note) => {
    axios
      .put(
        `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
        { ...sector, note: note }
      )
      .then(() => {
        sector.note = note;
        notification.open({
          message: "Sector note updated:",
          description: note,
        });
      })
      .catch((err) => {
        if (typeof onError === "function") {
          onError(err);
        }
      });
  };

  const updateSectorEntities = (entities) => {
    axios
      .put(
        `${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`,
        { ...sector, entities: entities }
      )
      .then(() => {
        sector.entities = entities;
        notification.open({
          message: "Sector entities updated",
        });
      })
      .catch((err) => {
        if (typeof onError === "function") {
          onError(err);
        }
      });
  };

  return (
    <React.Fragment>
      <Row style={{ marginTop: "8px" }}>
        <Col span={9}>Nom. code</Col>
        <Col span={15} style={{ paddingLeft: "8px" }}>
          <Select
            style={{ width: "100%" }}
            defaultValue={sector.code}
            onChange={(value) => updateSectorCode(value)}
            showSearch
            allowClear
          >
            {nomCode.map((f) => {
              return (
                <Option key={f.name} value={f.name}>
                  {f.name}
                </Option>
              );
            })}
          </Select>
        </Col>
      </Row>
      <Row style={{ marginTop: "8px" }}>
        <Col span={9}>Ranks</Col>
        <Col span={15} style={{ paddingLeft: "8px" }}>
          <Input.Group style={{ width: "100%" }}>
            <Select
              style={{ width: "70%" }}
              mode="multiple"
              value={sector.ranks || []}
              onChange={(value) => updateSectorRank(value)}
              showSearch
              allowClear
            >
              {(sectorDatasetRanks || []).map((r) => {
                return (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                );
              })}
            </Select>
            <Button onClick={() => updateSectorRank(sectorDatasetRanks)}>
              All
            </Button>
          </Input.Group>
        </Col>
      </Row>

      <Row style={{ marginTop: "8px" }}>
        <Col span={9}>Entities</Col>
        <Col span={15} style={{ paddingLeft: "8px" }}>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            defaultValue={sector.entities || []}
            onChange={(value) => updateSectorEntities(value)}
            showSearch
            allowClear
          >
            {entitytype.map((f) => {
              return (
                <Option key={f.name} value={f.name}>
                  {f.name}
                </Option>
              );
            })}
          </Select>
        </Col>
      </Row>

      <Row style={{ marginTop: "8px" }}>
        <Col span={8}>Target</Col>
        <Col span={1} style={{ textAlign: "right" }}>
          {targetDisabled && (
            <a>
              <LockOutlined onClick={() => setTargetDisabled(false)} />
            </a>
          )}
          {!targetDisabled && (
            <a>
              <UnlockOutlined onClick={() => setTargetDisabled(true)} />
            </a>
          )}
        </Col>
        <Col span={15} style={{ paddingLeft: "8px" }}>
          <NameAutocomplete
            disabled={targetDisabled}
            datasetKey={sector.datasetKey}
            defaultTaxonKey={_.get(sector, "target.id") || null}
            onSelectName={(name) => updateTargetOrSubject(name, "target")}
            onResetSearch={() => {}}
          />
          {/*           <Input.Search 
            enterButton={<SaveOutlined />} 
            onSearch={parentName => updateParent(parentName, 'target')}
            defaultValue={_.get(sector, 'target.parent') || null} /> */}
        </Col>
      </Row>
      <Row style={{ marginTop: "8px" }}>
        <Col span={8}>Subject</Col>
        <Col span={1} style={{ textAlign: "right" }}>
          {subjectDisabled && (
            <a>
              <LockOutlined onClick={() => setSubjectDisabled(false)} />
            </a>
          )}
          {!subjectDisabled && (
            <a>
              <UnlockOutlined onClick={() => setSubjectDisabled(true)} />
            </a>
          )}
        </Col>
        <Col span={15} style={{ paddingLeft: "8px" }}>
          <NameAutocomplete
            disabled={subjectDisabled}
            datasetKey={sector.subjectDatasetKey}
            defaultTaxonKey={_.get(sector, "subject.id") || null}
            onSelectName={(name) => updateTargetOrSubject(name, "subject")}
            onResetSearch={() => {}}
          />
          {/*           <Input.Search 
            enterButton={<SaveOutlined />} 
            onSearch={parentName => updateParent(parentName, 'subject')}
            defaultValue={_.get(sector, 'subject.parent') || null} /> */}
        </Col>
      </Row>
      {sector.placeholderRank && (
        <Row style={{ marginTop: "8px" }}>
          <Col span={9}>Placeholder rank</Col>
          <Col span={15} style={{ paddingLeft: "8px" }}>
            <Select
              style={{ width: "100%" }}
              defaultValue={sector.placeholderRank}
              onChange={(value) => updatePlaceholderRank(value)}
              showSearch
              allowClear
            >
              {rank.map((r) => {
                return (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                );
              })}
            </Select>
          </Col>
        </Row>
      )}

      <Row style={{ marginTop: "8px" }}>
        <SectorNote note={sector.note} onSave={updateSectorNote}></SectorNote>
      </Row>
    </React.Fragment>
  );
};

const mapContextToProps = ({ nomCode, entitytype, rank }) => ({
  nomCode,
  entitytype,
  rank,
});
export default withContext(mapContextToProps)(SectorForm);
