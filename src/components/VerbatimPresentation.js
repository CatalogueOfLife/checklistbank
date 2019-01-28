import React from "react";
import config from "../config";
import _ from "lodash"
import axios from "axios";
import { Alert, Tag, Spin, Tooltip } from "antd";
import ErrorMsg from "./ErrorMsg";
import PresentationItem from "./PresentationItem";
import PresentationGroupHeader from "./PresentationGroupHeader";
import {NavLink} from "react-router-dom"

import withContext from "./hoc/withContext";



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
 

  render = () => {
    const { verbatimLoading, verbatimError, verbatim } = this.state;
    const {issueMap, datasetKey, termsMap} = this.props;
    const title = _.get(verbatim, 'type') && _.get(verbatim, 'key') ? `Verbatim ${_.get(verbatim, 'type')} - ${_.get(verbatim, 'key')}` : 'Verbatim'
    return (
      <React.Fragment>
        <PresentationGroupHeader title={title} />
        {verbatimLoading && <Spin />}
        {verbatimError && (
          <Alert message={<ErrorMsg error={verbatimError} />} type="error" />
        )}
        {_.get(verbatim, 'file') &&
          
            <PresentationItem key="file" label="File">
              {`${_.get(verbatim, 'file') }${_.get(verbatim, 'line') ? `, line ${_.get(verbatim, 'line')}`: ''}`}
            </PresentationItem>
          }
        {_.get(verbatim, "issues") && verbatim.issues.length > 0 && (
          <PresentationItem label="Issues and flags">
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
            <PresentationItem key={t} label={t}>
                {termsMap[t] ? <NavLink key={t}
          to={{
            pathname: `/dataset/${datasetKey}/${termsMap[t]}/${encodeURIComponent(
                verbatim.terms[t]
            )}`
          }}>{verbatim.terms[t]}</NavLink> : verbatim.terms[t]}
            </PresentationItem>
          ))}
      </React.Fragment>
    );
  };
}

const mapContextToProps = ({ issueMap, termsMap }) => ({ issueMap, termsMap });

export default withContext(mapContextToProps)(VerbatimPresentation)