import { Typography } from "antd";
import config from "../../../config";

const { Text } = Typography;

// Sector key linked to the sector's JSON resource in the API
const SectorKeyLink = ({ sector }) => (
  <Text>
    Sector{" "}
    <a
      href={`${config.dataApi}dataset/${sector.datasetKey}/sector/${sector.id}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {sector.id}
    </a>
  </Text>
);

export default SectorKeyLink;
