import React from "react";


export default ({person, style}) => 
<span style={style} >
    <div>{`${person.familyName}${person.givenName ? ', '+person.givenName : ''}`}</div>
      {person.email && <div><a href={`mailto:${person.email}`}>{person.email}</a></div>}
      {person.orcid && <div><a href={`https://orcid.org/${person.orcid}`}><img src="/images/orcid_16x16.png" style={{ flex: '0 0 auto' }} alt=""></img> {person.orcid}</a></div>}
</span>