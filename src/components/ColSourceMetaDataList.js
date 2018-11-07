import React from "react";
import _ from "lodash";
import moment from 'moment'
import { List, Rate } from "antd";



class ColSourceMetaDataList extends React.Component {
 
  render = () => {
    const { colSource } = this.props;
    return (
      <List itemLayout="horizontal">
        <List.Item>
          <List.Item.Meta title="Source ID" description={colSource.key} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Full Name" description={colSource.title} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Short Name" description={colSource.alias} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Version" description={colSource.version} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Release Date" description={moment(colSource.released).format("MMM Do YYYY")} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Authors/Editors" description={_.get(colSource, 'authorsAndEditors[0]')} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Coverage" description={_.get(colSource, 'coverage')} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="English name of the group" description={_.get(colSource, 'group')} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Abstract" description={colSource.description} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Organisation" description={colSource.organisation} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Home Page" description={<a href="colSource.homepage" href="_blank">{colSource.homepage}</a>} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Contact Person" description={colSource.contactPerson} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Bibliographic Citation" description={colSource.citation} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Completeness" description={`${colSource.completeness}%`} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Checklist Confidence" description={<Rate value={colSource.confidence} disabled></Rate>} />
        </List.Item>
        <List.Item>
          <List.Item.Meta title="Editor’s comments" description={colSource.notes} />
        </List.Item>
      </List>
    );
  };
}

export default ColSourceMetaDataList;
