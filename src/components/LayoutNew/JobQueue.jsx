import withContext from "../../components/hoc/withContext";
import { TbStack2 } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { Badge } from "antd";

/**
 * The personal job dashboard indicator: how many of the logged-in user's jobs
 * are running or queued right now, across every lane.
 */
const JobQueue = (props) => {
  const { user, jobQueue } = props;

  // Only logged-in users see the queue indicator.
  if (!user) return null;

  const mine = [
    ...(jobQueue?.running || []),
    ...(jobQueue?.queued || []),
  ].filter((j) => j.userKey === user.key);

  return (
    <NavLink
      to="/jobs?tab=queue&mine=true"
      style={{ color: "black", marginRight: "16px" }}
      title={`${mine.length} of your jobs running or queued`}
    >
      <Badge count={mine.length} size="small">
        <TbStack2 size={16} />
      </Badge>
    </NavLink>
  );
};

const mapContextToProps = ({ user, jobQueue }) => ({ user, jobQueue });

export default withContext(mapContextToProps)(JobQueue);
