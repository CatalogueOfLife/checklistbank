import React from "react";
import _ from "lodash";
import moment from 'moment'
import { List, Rate } from "antd";
import { FormattedMessage } from 'react-intl'
import PresentationItem from './PresentationItem'


class ColSourceMetaDataList extends React.Component {
 
  render = () => {
    const { colSource } = this.props;
    return (
      <React.Fragment>
      <dl>
          <PresentationItem label={<FormattedMessage id="Source ID" defaultMessage="Source ID" />} >
            {colSource.key}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Full Name" defaultMessage="Full Name" />} >
          {colSource.title}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Short Name" defaultMessage="Short Name" />} >
          {colSource.alias}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Version" defaultMessage="Version" />} >
          {colSource.version}
          </PresentationItem>
           <PresentationItem label={<FormattedMessage id="Release Date" defaultMessage="Release Date" />} >
           {moment(colSource.released).format("MMM Do YYYY")}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Authors/Editors" defaultMessage="Authors/Editors" />} >
          {_.get(colSource, 'authorsAndEditors[0]')}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Coverage" defaultMessage="Coverage" />} >
          {_.get(colSource, 'coverage')}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="English name of the group" defaultMessage="English name of the group" />} >
          {_.get(colSource, 'group')}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Abstract" defaultMessage="Abstract" />} >
          {colSource.description}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Organisation"  defaultMessage="Organisation"  />} >
          {colSource.organisation}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Home Page"  defaultMessage="Home Page"  />} >
          {<a href="colSource.homepage" href="_blank">{colSource.homepage}</a>}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Contact Person"  defaultMessage="Contact Person"  />} >
          {colSource.contactPerson}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Bibliographic Citation" defaultMessage="Bibliographic Citation"  />} >
          {colSource.citation}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Completeness"  defaultMessage="Completeness"  />} >
          {!isNaN(colSource.completeness) && `${colSource.completeness}%`}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Checklist Confidence" defaultMessage="Checklist Confidence" />} >
          {<Rate value={colSource.confidence} disabled></Rate>}
          </PresentationItem>
          <PresentationItem label={<FormattedMessage id="Editor’s comments"  defaultMessage="Editor’s comments"  />} >
          {colSource.notes}
          </PresentationItem>
          </dl>

      </React.Fragment>
    );
  };
}

export default ColSourceMetaDataList;
