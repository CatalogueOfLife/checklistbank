import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Popover, Spin } from "antd";
import { getDatasetsBatch } from "../../../api/dataset";
import DataLoader from "dataloader";
import _ from 'lodash'
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

const TaxonSources = ({ datasetSectors, taxon, releaseKey }) => {
  const [data, setData] = useState([]);
  const [showInNode, setShowInNode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popOverVisible, setPopOverVisible] = useState(false);

  const getData = () => {
    setLoading(true);
    const promises = Object.keys(datasetSectors).map((s) =>
      datasetLoader.load(s).then((dataset) => dataset)
    );

    Promise.all(promises).then((result) => {
      setData(_.sortBy(result, ['alias']));
      setLoading(false);
    });
  };

  useEffect(() => {
    if (Object.keys(datasetSectors).length < 4) {
      setShowInNode(true);
      getData();
    }
  }, []);

  return showInNode ? (
    <>
      {data.map((d, index) => (
        <span key={index} style={{ fontSize: "11px" }}>
          <NavLink
            to={{
              pathname: releaseKey
                ? `/dataset/${releaseKey}/source/${d.key}`
                : `/dataset/${d.key}/metadata`,
            }}
            end
          >
            {(index ? ", " : "") + (d.alias || d.key)}
          </NavLink>
        </span>
      ))}
    </>
  ) : (
    <>
      <Popover
        content={
          loading ? (
            <Spin />
          ) : (
            <div style={{ maxWidth: "400px" }}>
              <span>Source databases: </span>
              {data.map((d, index) => (
                <span style={{ fontSize: "11px" }}>
                  <NavLink
                    to={{
                      pathname: releaseKey
                        ? `/dataset/${releaseKey}/source/${d.key}`
                        : `/dataset/${d.key}/metadata`,
                    }}
                    end
                  >
                    {(index ? ", " : "") + (d.alias || d.key)}
                  </NavLink>
                </span>
              ))}
            </div>
          )
        }
        title={<span dangerouslySetInnerHTML={{ __html: taxon.name }} />}
        open={popOverVisible}
        onOpenChange={() =>
          setPopOverVisible(!popOverVisible)
        }
        trigger="click"
        placement="rightTop"
      >
        <a
          style={{ fontSize: "11px" }}
          href=""
          onClick={() => {
            getData();
            setPopOverVisible(!popOverVisible);
          }}
        >
          Multiple providers
        </a>
      </Popover>
    </>
  );
};

export default TaxonSources;
