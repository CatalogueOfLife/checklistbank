import { color } from "highcharts";
import withContext from "../../components/hoc/withContext";
import { TbActivity } from "react-icons/tb";
import { NavLink } from "react-router-dom/cjs/react-router-dom.min";
import { Badge } from "antd";
const Health = (props) => {
  const { allComponentsRunning, allHealthChecksPassing } = props;

  let color;
  if (allComponentsRunning === true && allHealthChecksPassing === true) {
    color = "green";
  } else if (
    allHealthChecksPassing === true &&
    allComponentsRunning === false
  ) {
    color = "orange";
  } else if (allHealthChecksPassing === false) {
    color = "red";
  }

  return (
    <NavLink to="/system-health" style={{ color: "black" }}>
      <Badge dot={!!color} style={{ backgroundColor: color }}>
        <TbActivity size={16} />
      </Badge>
    </NavLink>
  );
};

const mapContextToProps = ({
  allComponentsRunning,
  allHealthChecksPassing,
}) => ({ allComponentsRunning, allHealthChecksPassing });

export default withContext(mapContextToProps)(Health);
