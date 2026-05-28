import { useEffect, useState } from "react";
import withContext from "../../components/hoc/withContext";
import withRouter from "../../withRouter";
import config from "../../config";
import _ from "lodash";
import { SettingOutlined } from "@ant-design/icons";
import { Modal, Select, Typography } from "antd";
import history from "../../history";
import { truncate } from "../../components/util";

import axios from "axios";
const {Text, Link} = Typography;

const ProjectSelect = ({ match, location, project, setProject, user, iconOnly = false, style = {} }) => {
  const { params: { projectKey } } = match;
  const [projects, setProjects] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const getProjects = () => {
    setLoading(true);
    axios(
      `${config.dataApi}dataset?origin=project&limit=1000`
    ).then((res) =>
      setProjects(_.get(res, "data.result") ? _.get(res, "data.result") : [])
    ).finally(() => setLoading(false));
  };

  useEffect(() => {
    getProjects();
  }, []);

  const hide = () => {
    setVisible(false);
  };

  const onProjectChange = (newProjectKey) => {
    if (projectKey) {
      const newPath = _.get(location, "pathname", "").replace(
        `project/${projectKey}/`,
        `project/${newProjectKey}/`
      );
      history.push({
        pathname: newPath,
      });
    } else {
      const selectedProject = projects.find(
        (c) => c.key === newProjectKey
      );
      setProject(selectedProject);
    }
    setVisible(false);
  };

  return (
    <>
      <a
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          setVisible(true);
        }}
      >
        {iconOnly && <SettingOutlined />}
        {!iconOnly && project &&
          `${project?.alias ? project.alias : truncate(project?.title, 25)} [${project.key}]`
        }
        {!iconOnly && !project && `Select`}

      </a>
      <Modal
        title="Select project"
        open={visible}
        mask={{ closable: true }}
        onCancel={hide}
        footer={null}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          <Select
            showSearch
            loading={loading}
            style={{ width: "100%" }}
            value={projectKey || null}
            placeholder="Select project"
            optionFilterProp="label"
            onChange={onProjectChange}
            filterOption={(input, option) =>
              option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onOpenChange={(open) => {
              if (open) {
                getProjects();
              }
            }}
            options={projects.map((c) => ({
              value: c.key,
              label: `${c.alias ? c.alias : truncate(c.title, 50)} [${c.key}]`,
            }))}
          />
        </div>
      </Modal>
    </>
  );
};

const mapContextToProps = ({
  projectKey,
  project,
  setProject,
  user,
}) => ({
  projectKey,
  project,
  setProject,
  user,
});
export default withContext(mapContextToProps)(withRouter(ProjectSelect));
