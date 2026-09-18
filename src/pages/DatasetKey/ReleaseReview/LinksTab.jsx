import { List } from "antd";
import { NavLink } from "react-router-dom";
import config from "../../../config";
import withContext from "../../../components/hoc/withContext";
import {
  sourceMetricsLink,
  namesDiffLink,
  duplicatesLink,
  releaseReportLink,
} from "./links";

/**
 * The views a release review always starts from, prefilled for this release
 * pair so nothing has to be selected by hand, and the reports the release job
 * left on the download server.
 */
const LinksTab = ({ datasetKey, previousReleaseKey, diffRoot, dataset, rank }) => {
  const report = (file) => releaseReportLink(config.downloadApi, dataset, file);

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
    {
      title: "ID reports",
      description:
        "Identifiers this release created, deleted and resurrected, and names whose identifier changed. A zip archive, despite its .gz name.",
      href: report("id-reports.gz"),
    },
    {
      title: "Release log",
      description:
        "The complete, gzipped log of the release job. Several GB unpacked, almost all of it per-identifier lines of the ID provider.",
      href: report("job.log.gz"),
    },
    {
      title: "All release reports",
      description:
        "The report directory of this release attempt, with everything above and the AI review once it has run.",
      href: report(),
    },
  ].filter((l) => l.to || l.href);

  return (
    <List
      itemLayout="horizontal"
      dataSource={links}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
              item.to ? (
                <NavLink to={item.to}>{item.title}</NavLink>
              ) : (
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              )
            }
            description={item.description}
          />
        </List.Item>
      )}
    />
  );
};

const mapContextToProps = ({ rank }) => ({ rank });
export default withContext(mapContextToProps)(LinksTab);
