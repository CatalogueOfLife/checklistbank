import React from "react";
import { Collapse } from "antd";

import PageContent from "../../../components/PageContent";
import SectorPageContent from "../../project/ProjectSectors/SectorPageContent";
import ProfileList from "../../project/SectorProfiles/ProfileList";

const ReleaseSectors = ({ datasetKey }) => {
  return (
    <PageContent>
      <Collapse
        style={{ marginBottom: "10px" }}
        items={[
          {
            key: "profiles",
            label: "Sector profiles of this release",
            children: (
              <ProfileList datasetKey={datasetKey} readOnly sectorsPath={`/dataset/${datasetKey}/sector`} />
            ),
          },
        ]}
      />
      <SectorPageContent datasetKey={datasetKey} />
    </PageContent>
  );
};

export default ReleaseSectors;
