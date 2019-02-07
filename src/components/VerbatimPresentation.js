import React from "react";
import config from "../config";
import _ from "lodash"
import axios from "axios";
import { Alert, Tag, Spin, Tooltip, Icon } from "antd";
import ErrorMsg from "./ErrorMsg";
import PresentationItem from "./PresentationItem";
import PresentationGroupHeader from "./PresentationGroupHeader";
import {NavLink} from "react-router-dom"

import withContext from "./hoc/withContext";

const md = 5

const parentRelations = ["dwc:Taxon.dwc:parentNameUsageID", "col:Taxon.col:parentID"]
const isValidURL = (string) => {
    if (typeof string !== 'string') return false;
    var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    if (res == null)
      return false;
    else
      return true;
  };

class VerbatimPresentation extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      verbatimLoading: true,
      verbatim: null,
      verbatimError: null
    };
  }
  componentWillMount() {
    const { verbatimKey, datasetKey } = this.props;
    this.setState({ verbatimLoading: true });
    axios(
      `${config.dataApi}dataset/${datasetKey}/verbatim/${encodeURIComponent(
        verbatimKey
      )}`
    )
      .then(res => {
        this.setState({
          verbatimLoading: false,
          verbatim: res.data,
          verbatimError: null
        });
      })
      .catch(err => {
        this.setState({
          verbatimLoading: false,
          verbatimError: err,
          verbatim: null
        });
      });
  }
 
  renderTerm = (key, value, type) => {
      const {termsMap,termsMapReversed, datasetKey} = this.props;

      if(_.get(termsMap, `${type}.${key}`)){

        const primaryKeys = _.get(termsMap, `${type}.${key}`);

        const types = [...new Set(primaryKeys.map(p => `type=${p.split('.')[0]}`))]
        const terms = primaryKeys.map(p => `${p.split('.')[1]}=${value}`)
          return <NavLink key={key}
          to={{
            pathname: `/dataset/${datasetKey}/verbatim`,
            search: `?${types.join('&')}&${terms.join('&')}&termOp=OR`
          }}>{value}</NavLink>
      } else if(_.get(termsMapReversed, `${type}.${key}`)){

        const foreignKeys = _.get(termsMapReversed, `${type}.${key}`).filter(k => !parentRelations.includes(k));

        const types = [...new Set(foreignKeys.map(p => `type=${p.split('.')[0]}`))]
        const terms = foreignKeys.map(p => `${p.split('.')[1]}=${value}`)
          return <React.Fragment>{value} <NavLink key={key}
          to={{
            pathname: `/dataset/${datasetKey}/verbatim`,
            search: `?${types.join('&')}&${terms.join('&')}&termOp=OR`
          }}> <Icon type="link"></Icon></NavLink></React.Fragment>
      } else {
        return   isValidURL(value) ? <a href={value} target="_blank">{value}</a> : value 
      }

  }
  render = () => {
    const { verbatimLoading, verbatimError, verbatim } = this.state;
    const {issueMap, basicHeader} = this.props;
    const title = _.get(verbatim, 'type') && _.get(verbatim, 'key') ? `${basicHeader ? '': 'Verbatim'} ${_.get(verbatim, 'type')} - ${_.get(verbatim, 'key')}` : 'Verbatim'
    return (
      <React.Fragment>
        <PresentationGroupHeader title={title} />
        {verbatimLoading && <Spin />}
        {verbatimError && (
          <Alert message={<ErrorMsg error={verbatimError} />} type="error" />
        )}
        {_.get(verbatim, 'file') &&
          
            <PresentationItem md={md} key="file" label="File">
              {`${_.get(verbatim, 'file') }${_.get(verbatim, 'line') ? `, line ${_.get(verbatim, 'line')}`: ''}`}
            </PresentationItem>
          }
        {_.get(verbatim, "issues") && verbatim.issues.length > 0 && (
          <PresentationItem md={md} label="Issues and flags">
            <div>
              {verbatim.issues.map(i => (
                <Tooltip key={i} title={_.get(issueMap, `[${i}].description`)}>
                  <Tag key={i} color={_.get(issueMap, `[${i}].color`)}>
                    {i}
                  </Tag>
                </Tooltip>
              ))}
            </div>
          </PresentationItem>
        )}
        

        {_.get(verbatim, "terms") &&
          Object.keys(verbatim.terms).map(t => (
            <PresentationItem md={md} label={t} key={t}>
            {this.renderTerm(t, verbatim.terms[t], _.get(verbatim, 'type')  )}
            </PresentationItem>
          ))}
      </React.Fragment>
    );
  };
}

const mapContextToProps = ({ issueMap, termsMap, termsMapReversed }) => ({ issueMap, termsMap, termsMapReversed });

export default withContext(mapContextToProps)(VerbatimPresentation)