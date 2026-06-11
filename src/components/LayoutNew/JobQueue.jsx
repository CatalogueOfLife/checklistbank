import withContext from "../../components/hoc/withContext";
import { TbStack2 } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { Badge } from "antd";

const JobQueue = (props) => {
  const { user, jobQueue } = props;

  // Only logged-in users see the queue indicator.
  if (!user) return null;

  const running =
    (jobQueue?.importsRunningCount || 0) + (jobQueue?.jobsRunning?.length || 0);

  return (
    <NavLink to="/jobqueue" style={{ color: "black", marginRight: "16px" }}>
      <Badge count={running} size="small">
        <TbStack2 size={16} />
      </Badge>
    </NavLink>
  );
};

const mapContextToProps = ({ user, jobQueue }) => ({ user, jobQueue });

export default withContext(mapContextToProps)(JobQueue);
