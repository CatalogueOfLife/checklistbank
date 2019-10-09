import React from "react";
import PropTypes from "prop-types";
import Layout from "../../components/LayoutNew";
import config from "../../config";
import axios from "axios";
import VerbatimPresentation from "../../components/VerbatimPresentation";
import qs from "query-string";
import _ from "lodash";
import { Alert, Row, Col, Pagination } from "antd";
import ErrorMsg from "../../components/ErrorMsg";
import withContext from "../../components/hoc/withContext";
import SearchBox from "../DatasetList/SearchBox";
import history from "../../history";
import MultiValueFilter from "../NameSearch/MultiValueFilter";

const removeEmptyValues = (obj) => {
    
   return Object.entries(obj).reduce((a,[k,v]) => (v ? {...a, [k]:v} : a), {})
 
}

class VerbatimRecord extends React.Component {
  constructor(props) {
    super(props);
    const lsLimit = localStorage.getItem("col_plus_verbatim_limit");

    this.state = {
      verbatim: [],
      verbatimError: null,
      total: 0,
      limit: lsLimit ? Number(lsLimit) : 10,
      offset: 0
    };
  }

  componentDidMount = () => {
    let params = qs.parse(_.get(this.props, "location.search"));
    if(!params.limit){
      params.limit = this.state.limit
    }
    this.getVerbatimData(params);
  };

  componentWillReceiveProps(nextProps) {
    if (
      _.get(this.props, "location.search") !==
      _.get(nextProps, "location.search")
    ) {
      let params = qs.parse(_.get(nextProps, "location.search"));
      if(!params.limit){
        params.limit = this.state.limit
      }
      this.getVerbatimData(params);
    }
  }

  getVerbatimData = params => {
    const {
      match: {
        params: { key }
      }
    } = this.props;
    axios(`${config.dataApi}dataset/${key}/verbatim?${qs.stringify(params)}`)
      .then(res => {
        this.setState({
          verbatim: res.data.result,
          verbatimError: null,
          limit: res.data.limit,
          offset: res.data.offset,
          total: res.data.total
        });
      })
      .catch(err => {
        this.setState({
          verbatimError: err,
          verbatim: []
        });
      });
  };

  onSearch = search => {
    const { location } = this.props;
    const params = qs.parse(_.get(location, "search"));
    const query = {q: params.q, type: params.type};
    let newQuery = {...query, ...search};
    
    history.push({
      pathname: location.path,
      search: `?${qs.stringify(removeEmptyValues(newQuery))}`
    });
  };

  render = () => {
    const { location, lastSuccesFullImport } = this.props;
    const { total, limit, offset, verbatim, verbatimError } = this.state;
    const current = Number(offset) / Number(limit) + 1;
    const params = qs.parse(_.get(location, "search"));

    const typeFacets = lastSuccesFullImport ? 
      Object.keys(lastSuccesFullImport.verbatimByTypeCount)
        .map(t => ({
          value: t,
          label: `${t} (${lastSuccesFullImport.verbatimByTypeCount[t]})`
        })) : [];
          

    return (
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0"
        }}
      >
        {verbatimError && (
          <Alert message={<ErrorMsg error={verbatimError} />} type="error" />
        )}
        <Row style={{ marginBottom: "10px" }}>
          <Col span={12}>
            {" "}
            <SearchBox onSearch={value => this.onSearch({ q: value })} defaultValue={_.get(params, 'q')}></SearchBox>

            
          </Col>
          <Col span={12}>
          <MultiValueFilter
                  defaultValue={_.get(params, "type")}
                  onChange={value => this.onSearch({ type: value })}
                  vocab={typeFacets}
                  label="Row type"
                />
          </Col>
          <Col span={24} style={{ textAlign: "right" }}>
            {" "}
            {
              <Pagination
                hideOnSinglePage={true}
                style={{ display: "inline" }}
                current={current}
                showSizeChanger
                pageSizeOptions={["10", "50", "100"]}
                onShowSizeChange={(current, size) => {
                  localStorage.setItem("col_plus_verbatim_limit", size);
                  history.push({
                    pathname: location.path,
                    search: `?${qs.stringify({
                      ...params,
                      limit: Number(size)
                    })}`
                  });
                }}
                onChange={(page, pageSize) => {
                  history.push({
                    pathname: location.path,
                    search: `?${qs.stringify({
                      ...params,
                      offset: (page - 1) * Number(limit)
                    })}`
                  });
                }}
                pageSize={Number(limit)}
                total={total}
              />
            }
          </Col>
        </Row>

        {verbatim &&
          verbatim.length > 0 &&
          verbatim.map(v => (
            <VerbatimPresentation
              key={v.id}
              datasetKey={v.datasetKey}
              verbatimKey={v.id}
              basicHeader={true}
            />
          ))}
      </div>
    );
  };
}

const mapContextToProps = ({ dataset }) => ({ dataset });
export default withContext(mapContextToProps)(VerbatimRecord);
