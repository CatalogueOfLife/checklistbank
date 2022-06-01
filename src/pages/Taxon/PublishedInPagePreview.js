import React from 'react'
import _ from 'lodash'
import { Image } from 'antd'
const PublishedInPagePreview = ({publishedInPageLink, style={}}) => {

    const splitted = (publishedInPageLink || "").split('.')
    const fileExt = _.get(splitted, `[${splitted.length - 1}]`, '')

    return ['jpg', 'jpeg', 'png'].includes(fileExt.toLowerCase()) ? <div style={style}><Image  
    preview={{
    src: `//api.gbif.org/v1/image/unsafe/${publishedInPageLink}`,
    }}
  src={`//api.gbif.org/v1/image/unsafe/60x/${publishedInPageLink}`}
/></div> : null

}

export default PublishedInPagePreview;