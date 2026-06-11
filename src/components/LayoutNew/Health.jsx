import withContext from "../../components/hoc/withContext";
import { TbActivity } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { Badge } from "antd";

const Health = (props) => {
  const { components, health } = props;

  // Number of system components that are not running (idle is a status flag,
  // not a component) plus the number of failing health checks.
  const unavailableComponents = Object.keys(components).filter(
    (c) => c !== "idle" && !components[c]
  ).length;
  const failingHealthChecks = Object.keys(health).filter(
    (hc) => !health[hc].healthy
  ).length;
  const problemCount = unavailableComponents + failingHealthChecks;

  return (
    <NavLink to="/system-health" style={{ color: "black" }}>
      <Badge count={problemCount} size="small">
        <TbActivity size={16} />
      </Badge>
    </NavLink>
  );
};

const mapContextToProps = ({ components, health }) => ({
  components,
  health,
});

export default withContext(mapContextToProps)(Health);
