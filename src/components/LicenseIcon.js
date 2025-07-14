import React from "react";
import { Badge } from "antd";
import Icon from '@ant-design/icons';
import bySVG from "./Icons/cc-svg/by.svg";
import ccSVG from "./Icons/cc-svg/cc.svg";
import ncSVG from "./Icons/cc-svg/nc.svg";
import ndSVG from "./Icons/cc-svg/nd.svg";
import pdSVG from "./Icons/cc-svg/pd.svg";
import saSVG from "./Icons/cc-svg/sa.svg";
import zeroSVG from "./Icons/cc-svg/zero.svg";  

const ccby = () => (
   <img src={bySVG} />
);
const cccc = () => (
   <img src={ccSVG} />
);
const ccnc = () => (
   <img src={ncSVG} />
);
const ccnd = () => (
   <img src={ndSVG} />
);
const ccpd = () => (
   <img src={pdSVG} />
);
const ccsa = () => (
   <img src={saSVG} />
);
const cczero = () => (
   <img src={zeroSVG} />
);

/**
 * Widget representing a creative commons license as a set of svg icons
 * @param value being the interpreted cc license string, e.g. "cc by" or "cc by sa"
 * @returns {*}
 * @constructor
 */
const LicenseIcon = ({ value }) =>
  <> 
    {value && value.includes("cc") ? (<Icon component={cccc} />) : null}
    {value && value.includes("0") ? (<Icon component={cczero} />) : null}
    {value && value.includes("pd") ? (<Icon component={ccpd} />) : null}
    {value && value.includes("by") ? (<Icon component={ccby} />) : null}
    {value && value.includes("nc") ? (<Icon component={ccnc} />) : null}
    {value && value.includes("nd") ? (<Icon component={ccnd} />) : null}
    {value && value.includes("sa") ? (<Icon component={ccsa} />) : null}
  </>


export default LicenseIcon;
