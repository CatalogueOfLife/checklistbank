import { List } from "antd";
import { NavLink } from "react-router-dom";
import withContext from "../../../components/hoc/withContext";
import { sourceMetricsLink, namesDiffLink, duplicatesLink } from "./links";

/**
 * The views a release review always starts from, prefilled for this release
 * pair so nothing has to be selected by hand.
 */
const LinksTab = ({ datasetKey, previousReleaseKey, diffRoot, rank }) => {
  const links = [
    {
      title: "Source metrics",
      description:
        "Per source dataset metrics of this release, compared against the previous one.",
      to: sourceMetricsLink(datasetKey, previousReleaseKey),
    },
    {
      title: "Names diff",
      description:
        "Dataset comparison of both releases, down to order, ignoring authorship and synonyms.",
      to: namesDiffLink(datasetKey, previousReleaseKey, diffRoot),
    },
    {
      title: "Duplicates of family and above",
      description:
        "Accepted uninomials that appear more than once at family rank or higher.",
      to: duplicatesLink(datasetKey, rank),
    },
  ];

  return (
    <List
      itemLayout="horizontal"
      dataSource={links}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={<NavLink to={item.to}>{item.title}</NavLink>}
            description={item.description}
          />
        </List.Item>
      )}
    />
  );
};

const mapContextToProps = ({ rank }) => ({ rank });
export default withContext(mapContextToProps)(LinksTab);
