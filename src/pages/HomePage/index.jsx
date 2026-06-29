import { useState, useEffect } from "react";

import Layout from "../../components/LayoutNew";
import { NavLink, useNavigate } from "react-router-dom";
import config from "../../config";
import moment from "dayjs";
import { Helmet } from "react-helmet-async";
import { Row, Col, Card, Input, Typography } from "antd";

const { Search } = Input;
const { Title, Paragraph } = Typography;

// Cross dataset name search needs a few characters to return useful results.
const MIN_NAME_QUERY = 3;
import withContext from "../../components/hoc/withContext";
import Hero from "./Hero"
import axios from "axios";

const HomePage = () => {
  const navigate = useNavigate();
  const [nameQuery, setNameQuery] = useState("");
  const [nameError, setNameError] = useState(null);
  const [error, setError] = useState(null);

  const searchDatasets = (value) => {
    const q = (value || "").trim();
    navigate(q ? `/dataset?q=${encodeURIComponent(q)}` : "/dataset");
  };

  const searchNames = (value) => {
    const q = (value || "").trim();
    if (q.length < MIN_NAME_QUERY) {
      setNameError(`Please enter at least ${MIN_NAME_QUERY} characters.`);
      return;
    }
    setNameError(null);
    navigate(
      `/nameusage/search?q=${encodeURIComponent(q)}&content=SCIENTIFIC_NAME`
    );
  };

  const [nameUsages, setNameUsages] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [baseRelease, setBaseRelease] = useState(null);
  const [extendedRelease, setExtendedRelease] = useState(null);

  const getNameUsages = () => {
    axios(`${config.dataApi}nameusage/search?limit=0`)
      .then((res) => {
        setError(null);
        setNameUsages(res.data);
      })
      .catch((err) => setError(err));
  };

  const getDatasets = () => {
    axios(`${config.dataApi}dataset?limit=3&sortBy=created`)
      .then((res) => {
        setDatasets(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setDatasets(null);
      });
  };

  // Fetch a COL release (base "3LR" or extended "3LXR") together with its
  // accepted species count, shown in the sidebar.
  const getRelease = (alias, setRelease) => {
    Promise.all([
      axios(`${config.dataApi}dataset/${alias}`),
      axios(
        `${config.dataApi}dataset/${alias}/nameusage/search?rank=species&status=accepted&status=provisionally_accepted&limit=0`
      ),
    ])
      .then(([meta, species]) => {
        setRelease({ ...meta.data, speciesCount: species.data.total });
        setError(null);
      })
      .catch((err) => setError(err));
  };

  useEffect(() => {
    getNameUsages();
    getDatasets();
    getRelease("3LR", setBaseRelease);
    getRelease("3LXR", setExtendedRelease);
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
        {/* Direct search: datasets and cross-dataset names */}
        <Row gutter={[32, 24]} style={{ marginTop: 28 }}>
          <Col xs={24} md={12}>
            <Title level={4} style={{ marginBottom: 4 }}>
              {datasets
                ? `Search ${datasets.total.toLocaleString()} datasets`
                : "Search datasets"}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              Find checklists by title, organisation, taxonomic scope and more.
            </Paragraph>
            <Search
              placeholder="e.g. World Spider Catalog"
              enterButton="Search"
              size="large"
              allowClear
              onSearch={searchDatasets}
            />
            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
              <NavLink to="/dataset">Browse all datasets →</NavLink>
            </Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Title level={4} style={{ marginBottom: 4 }}>
              {nameUsages
                ? `Search ${nameUsages.total.toLocaleString()} names`
                : "Search names"}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              Look up a scientific name across every checklist at once.
            </Paragraph>
            <Search
              placeholder="e.g. Panthera leo"
              enterButton="Search"
              size="large"
              allowClear
              value={nameQuery}
              status={nameError ? "error" : undefined}
              onChange={(e) => {
                setNameQuery(e.target.value);
                if (nameError) setNameError(null);
              }}
              onSearch={searchNames}
            />
            <Paragraph
              style={{
                marginTop: 4,
                marginBottom: 0,
                minHeight: 22,
                color: nameError ? "#ff4d4f" : undefined,
              }}
            >
              {nameError || (
                <NavLink to="/nameusage/search">Advanced name search →</NavLink>
              )}
            </Paragraph>
          </Col>
        </Row>

        <Row style={{ marginTop: 20 }}>
          <Col style={{ paddingRight: "30px" }} xs={24} sm={24} md={16} lg={16}>
            <p>
              <b>ChecklistBank</b> is a repository and index of taxonomic
              checklists, built jointly by the{" "}
              <a href="https://www.catalogueoflife.org">Catalogue of Life</a>{" "}
              and <a href="https://www.gbif.org">GBIF</a>. It lets anyone
              publish, discover, browse, download and cite openly licensed
              species lists — from the Catalogue of Life itself to the thousands
              of datasets registered through{" "}
              <a href="https://www.gbif.org/dataset/search?type=CHECKLIST">
                GBIF
              </a>
              .
            </p>
            <p>
              Whatever its original format, every dataset is given a
              standardised interpretation that you can explore here or query
              through the{" "}
              <a href="https://api.checklistbank.org">ChecklistBank API</a>.
              Publish your own checklist using{" "}
              <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md">
                ColDP
              </a>{" "}
              or another <a href="/about/formats">supported format</a>, and sign
              in with a <a href="https://www.gbif.org">GBIF account</a> to unlock
              all features.
            </p>
            <p>
              New here? Start with the <a href="/about/introduction">introduction</a>, 
              learn how to <a href="/about/contribute">contribute</a> data, 
              or use the <a href="/about/API">API</a>.
            </p>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8}>
            {(baseRelease || extendedRelease) && (
              <>
                <h3>Latest Catalogue of Life</h3>
                <ul>
                  {baseRelease && (
                    <li>
                      <NavLink to={`/dataset/${baseRelease.key}`} end>
                        {baseRelease.alias}
                      </NavLink>{" "}
                      — {baseRelease.speciesCount.toLocaleString()} species
                    </li>
                  )}
                  {extendedRelease && (
                    <li>
                      <NavLink to={`/dataset/${extendedRelease.key}`} end>
                        {extendedRelease.alias}
                      </NavLink>{" "}
                      — {extendedRelease.speciesCount.toLocaleString()} species
                    </li>
                  )}
                </ul>
              </>
            )}
            {datasets && (
              <>
                <h3>Latest datasets added</h3>
                <ul>
                  {datasets.result.map((d) => (
                    <li key={d.key}>
                      <NavLink to={{ pathname: `/dataset/${d.key}` }} end>
                        {d.title} ({moment(d.created).format("MMM Do YYYY")})
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Col>
        </Row>
      </Card>
    </Layout>
  );
};

const mapContextToProps = ({ projectKey }) => ({ projectKey });

export default withContext(mapContextToProps)(HomePage);
