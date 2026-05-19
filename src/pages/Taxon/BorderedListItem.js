import React from "react";
import { Row, Col } from "antd";

// Wrappers
import withWidth from "../../components/hoc/Width";
import styles from "./BorderedListItem.module.css";

/**
 * Component responsible for data display in a read mode
 * @param size - how dense should the layout be. options: 'small', 'medium' (default).
 * @param children - wrapped content
 * @param width - passed from withWidth wrapper, data about current page size
 * @returns {*}
 * @constructor
 */
const BorderedListItem = ({ children, size }) => {
  const getValue = () => {
    let value = (
      <span className={styles.noContent}>No information</span>
    );

    if (Array.isArray(children) && children.length > 0) {
      value = children.map((item, i) => (
        <span className={styles.content} key={i}>
          {item}
        </span>
      ));
    } else if (!Array.isArray(children) && typeof children !== "undefined") {
      value = <span className={styles.content}>{children}</span>;
    }

    return value;
  };

  const marginSize =
    size === "medium" ? styles.mediumMargin : styles.smallMargin;
  return (
    <Row className={styles.formItem}>
      <Col span={24} className={marginSize}>
        {getValue()}
      </Col>
    </Row>
  );
};

export default withWidth()(BorderedListItem);
