import { useState, useEffect } from "react";

import Layout from "../../components/LayoutNew";
import { NavLink } from "react-router-dom";
import config from "../../config";
import moment from "dayjs";
import { Helmet } from "react-helmet-async";
import { Row, Col, Statistic, Card, Image } from "antd";
import withContext from "../../components/hoc/withContext";
import Hero from "./Hero"
import axios from "axios";

const HomePage = () => {
  const [error, setError] = useState(null);
  const [nameUsages, setNameUsages] = useState(null);
  const [nameUsagesLoading, setNameUsagesLoading] = useState(false);
  const [colSpecies, setColSpecies] = useState(null);
  const [colSpeciesLoading, setColSpeciesLoading] = useState(false);
  const [datasets, setDatasets] = useState(null);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [latestCol, setLatestCol] = useState(null);

  const getNameUsages = () => {
    setNameUsagesLoading(true);
    axios(`${config.dataApi}nameusage/search?limit=0`)
      .then((res) => {
        setError(null);
        setNameUsagesLoading(false);
        setNameUsages(res.data);
      })
      .catch((err) => {
        setError(err);
        setNameUsagesLoading(false);
      });
  };

  const getCoLData = () => {
    setColSpeciesLoading(true);
    axios(
      `${config.dataApi}dataset/3LR/nameusage/search?rank=species&status=accepted&status=provisionally_accepted&limit=0`
    )
      .then((res) => {
        setError(null);
        setColSpeciesLoading(false);
        setColSpecies(res.data);
      })
      .catch((err) => {
        setError(err);
        setColSpeciesLoading(false);
      });
  };

  const getDatasets = () => {
    setDatasetsLoading(true);
    axios(`${config.dataApi}dataset?limit=3&sortBy=created`)
      .then((res) => {
        setDatasetsLoading(false);
        setDatasets(res.data);
        setError(null);
      })
      .catch((err) => {
        setDatasetsLoading(false);
        setError(err);
        setDatasets(null);
      });
  };

  const getLatestCol = () => {
    axios(`${config.dataApi}dataset/3LR`)
      .then((res) => {
        setLatestCol(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setLatestCol(null);
      });
  };

  useEffect(() => {
    getNameUsages();
    getCoLData();
    getDatasets();
    getLatestCol();
  }, []);

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
                end
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
              <NavLink to={{ pathname: `/` }} end>
                <Statistic
                  title="Name Usages in ChecklistBank"
                  value={nameUsages.total}
                />
              </NavLink>
            )}
          </Col>
          <Col xs={12}sm={12} md={6} lg={6}>
            {datasets && (
              <NavLink to={{ pathname: `/dataset` }} end>
                <Statistic
                  title="Datasets in ChecklistBank"
                  value={datasets.total}
                />
              </NavLink>
            )}
          </Col>
          <Col xs={12} sm={12}  md={6} lg={6}>
            {latestCol && (
              <NavLink to={{ pathname: `/dataset/${latestCol?.key}` }} end>
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
              <a href="https://www.catalogueoflife.org">Catalogue of Life</a> (COL) and <a href="https://www.catalogueoflife.org">GBIF</a>{" "}
              aim to support the publication and curation of checklists and
              to provide a platform for their consistent discovery, use and
              citation.
              GBIF has for some time maintained a checklist index and supported
              the network of repositories for its community to share checklist data.
              COL and GBIF have united their capabilities to make ChecklistBank a consistent foundation
              and repository for all COL datasets and any other openly licensed
              species lists, inluding those mobilized and registered through <a href="https://www.gbif.org/dataset/search?type=CHECKLIST">GBIF</a>.
            </p>
            <p>
              The taxonomic community can publish a checklist to ChecklistBank using <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md">ColDP</a>{" "}
              or any other <a href="/about/formats">supported format</a>.
            </p>
            <p>
              Regardless of the original data format, ChecklistBank generates
              a standardised interpretation. All datasets can be searched,
              browsed, downloaded or accessed programmatically via the{" "}
              <a href="https://api.checklistbank.org">ChecklistBank API</a>.
            </p>
            <p>
              In order to use all functions of ChecklistBanks you will need to login with a <a href="https://www.gbif.org">GBIF</a> user account.
              You can learn more about ChecklistBank in our <a href="/about/introduction">introduction pages</a>{" "}
              or our <a href="https://docs.gbif.org/course-checklistbank-tutorial/">user</a> and <a href="https://docs.gbif.org/course-checklistbank-project/">project</a> tutorials.
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
                      end
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
};

const mapContextToProps = ({ projectKey }) => ({ projectKey });

export default withContext(mapContextToProps)(HomePage);
