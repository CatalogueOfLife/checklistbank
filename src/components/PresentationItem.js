import React, {useRef, useState, useEffect} from "react";
import { Row, Col } from "antd";

import Help from "./Help";
import styles from "./PresentationItem.module.css";

// Wrappers
import withWidth, { MEDIUM } from "./hoc/Width";

function isOverflowing(el)
{
   var curOverflow = el.style.overflow;

   if ( !curOverflow || curOverflow === "visible" )
      el.style.overflow = "hidden";

   var isOverflowing = el.clientWidth < el.scrollWidth;

   el.style.overflow = curOverflow;

   return isOverflowing;
}

/**
 * Component responsible for data display in a read mode
 * @param label - label text
 * @param helpText - text to be displayed as a tip
 * @param md - Label column width on medium devices - seconds column is the reamining.
 * @param size - how dense should the layout be. options: 'small', 'medium' (default).
 * @param children - wrapped content
 * @param width - passed from withWidth wrapper, data about current page size
 * @returns {*}
 * @constructor
 */
const PresentationItem = ({
  label,
  helpText,
  children,
  width,
  md,
  size,
}) => {

  const labelRef = useRef();
  const [overflowHelp, setOverFlowHelp] = useState(null);
  const [formattedLabel, setFormattedLabel] = useState(label)
  useEffect(()=> {

    let overflow = labelRef.current && isOverflowing(labelRef.current);
    if(!overflow){
      setFormattedLabel(label)
    } else if(typeof label === 'string' && (label.startsWith('http://') || label.startsWith('https://'))) {
      setOverFlowHelp(label);
      const splitted = label.replace(/^https?:\/\//, '').split("/");
      setFormattedLabel(`${splitted[0]}...${splitted[splitted.length-1]}`)
    } else {
      setOverFlowHelp(label)
      setFormattedLabel(label)
    }

  }, [label, labelRef.current])

  const getValue = () => {
    let value = <dd className={styles.noContent}>No information</dd>;

    if (Array.isArray(children) && children.length > 0) {
      value = children.map((item, i) => (
        <dd className={styles.content} key={i}>
          {item}
        </dd>
      ));
    } else if (!Array.isArray(children) && typeof children !== "undefined") {
      value = <dd className={styles.content}>{children}</dd>;
    }

    return value;
  };

  const medium = md || 8;
  const mediumCol2 = medium < 24 ? 24 - medium : 24;
  const marginSize =
    size === "medium" ? styles.mediumMargin : styles.smallMargin;
  return (
    <Row className={styles.formItem}>
      <Col
        sm={24}
        md={medium}
        style={width < MEDIUM ? { marginBottom: 0 } : {}}
        className={marginSize}
      >
        <div>
          <dt className={styles.label} ref={labelRef} >
            {formattedLabel}
            <Help title={helpText || overflowHelp} />
          </dt>
        </div>
      </Col>
      <Col
        sm={24}
        md={mediumCol2}
        style={width < MEDIUM ? { marginTop: 0 } : {}}
        className={marginSize}
      >
        {getValue()}
      </Col>
    </Row>
  );
};

export default withWidth()(PresentationItem);
