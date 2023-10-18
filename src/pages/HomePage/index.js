import React from "react";

import Layout from "../../components/LayoutNew";
import { NavLink } from "react-router-dom";
import config from "../../config";
import moment from "moment";
import Helmet from "react-helmet";
import { Row, Col, Statistic, Card, View, Image } from "antd";
import withContext from "../../components/hoc/withContext";
import Hero from "./Hero"
import axios from "axios";

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      nameUsages: null,
      nameUsagesLoading: false,
      colSpecies: null,
      colSpeciesLoading: false,
      datasets: null,
      datasetsLoading: false,
      latestCol: null
    };
  }
  componentDidMount = () => {
    this.getNameUsages();
    this.getCoLData();
    this.getDatasets();
    this.getLatestCol();
  };
  getNameUsages = () => {
    this.setState({ nameUsagesLoading: true });
    axios(`${config.dataApi}nameusage/search?limit=0`)
      .then((res) => {
        this.setState({
          error: null,
          nameUsagesLoading: false,
          nameUsages: res.data,
        });
      })
      .catch((err) => this.setState({ error: err, nameUsagesLoading: false }));
  };

  getCoLData = () => {
    this.setState({ colSpeciesLoading: true });
    axios(
      `${config.dataApi}dataset/3LR/nameusage/search?rank=species&status=accepted&status=provisionally_accepted&limit=0`
    )
      .then((res) => {
        this.setState({
          error: null,
          colSpeciesLoading: false,
          colSpecies: res.data,
        });
      })
      .catch((err) => this.setState({ error: err, colSpeciesLoading: false }));
  };

  getDatasets = () => {
    this.setState({ datasetsLoading: true });
    axios(`${config.dataApi}dataset?limit=3&sortBy=created`)
      .then((res) => {
        this.setState({
          datasetsLoading: false,
          datasets: res.data,
          err: null,
        });
      })

      .catch((err) => {
        this.setState({ datasetsLoading: false, error: err, datasets: null });
      });
  };

  getLatestCol = () => {
    axios(`${config.dataApi}dataset/3LR`)
      .then((res) => {
        this.setState({
          latestCol: res.data,
          err: null,
        });
      })

      .catch((err) => {
        this.setState({  error: err, latestCol: null });
      });
  }

  render() {
    const { nameUsages, colSpecies, datasets , latestCol} = this.state;
    return (
      <Layout openKeys={[]} selectedKeys={[]} title="">
        <Helmet
          title="ChecklistBank"
          meta={[
            {
              charSet: "utf-8",
            },
          ]}
        />

        <Card
          style={{ marginTop: 20 }}
          cover={<Hero image={"/images/Pultenaea_procumbens.jpg"}/>
           
          }
        >
          <Row gutter={{
        xs: 8,
        sm: 16,
        md: 24,
        lg: 32,
      }}>
            <Col xs={12} sm={12} md={6}  lg={6}>
              {colSpecies && (
                <NavLink
                  to={{
                    pathname: `/dataset/3LR/names`,
                  }}
                  exact={true}
                >
                  <Statistic
                    title="Species in Catalogue of Life"
                    value={colSpecies.total}
                  />
                </NavLink>
              )}
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              {nameUsages && (
                <NavLink to={{ pathname: `/` }} exact={true}>
                  <Statistic
                    title="Name Usages in ChecklistBank"
                    value={nameUsages.total}
                  />
                </NavLink>
              )}
            </Col>
            <Col xs={12}sm={12} md={6} lg={6}>
              {datasets && (
                <NavLink to={{ pathname: `/dataset` }} exact={true}>
                  <Statistic
                    title="Datasets in ChecklistBank"
                    value={datasets.total}
                  />
                </NavLink>
              )}
            </Col>
            <Col xs={12} sm={12}  md={6} lg={6}>
              {latestCol && (
                <NavLink to={{ pathname: `/dataset/${latestCol?.key}` }} exact={true}>
                  <Statistic
                    title="Latest COL Checklist"
                    value={latestCol?.version}
                  />
                </NavLink>
              )}
            </Col>
          </Row>

          <Row style={{ marginTop: 20 }}>
            <Col style={{ paddingRight: "30px" }} xs={24} sm={24} md={16} lg={16}>
              <p>
                The{" "}
                <a href="https://www.catalogueoflife.org">
                  Catalogue of Life (COL)
                </a>{" "}
                aims to support the publication and curation of checklists and
                to provide a platform for their consistent discovery, use and
                citation.                 
                GBIF has for some time maintained ChecklistBank as a repository for
                its community to share checklist data. COL and GBIF have united
                their capabilities to make ChecklistBank a consistent foundation
                and repository for all COL datasets and any other publicly
                published species lists, inluding those registered with <a href="https://www.gbif.org/dataset/search?type=CHECKLIST">GBIF</a>.
              </p>
              <p>
                The taxonomic community can publish a checklist to ChecklistBank
                either by directly uploading a{" "}
                <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md">
                  ColDP
                </a>
                , DwC-A or ACEF file along with metadata describing its content
                or by publishing such a file on the Internet in a form that COL
                can consume and then registering the dataset with ChecklistBank.
              </p>
              <p>
                Regardless of the original data format, ChecklistBank generates
                a standardised interpretation. All datasets can be searched,
                browsed, downloaded or accessed programmatically via the{" "}
                <a href="https://api.checklistbank.org">ChecklistBank API</a>.
              </p>
              <p>
                In order to use all functions of ChecklistBanks you will need to login with a <a href="https://www.gbif.org">GBIF</a> user account.
                This includes a continuously improved <a href="/tools/diff-viewer">diff tool</a> for comparing datasets 
                as well as downloading custom exports.
              </p>
            </Col>
            {datasets && (
              <Col xs={24} sm={24} md={8} lg={8}>
                <h3>Latest datasets added</h3>
                <ul>
                  {datasets.result.map((d) => (
                    <li key={d.key}>
                      <NavLink
                        to={{
                          pathname: `/dataset/${d.key}`,
                        }}
                        exact={true}
                      >
                        {d.title} ({moment(d.created).format("MMM Do YYYY")})
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </Col>
            )}
          </Row>
        </Card>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogueKey }) => ({ catalogueKey });

export default withContext(mapContextToProps)(HomePage);
