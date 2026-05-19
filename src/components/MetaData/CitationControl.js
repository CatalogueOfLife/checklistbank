import React, { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Row, Tag, Modal } from "antd";
import styles from "../newTag.module.css";
import CslForm from "./CslForm";
import _ from "lodash";

const stringToArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  } else if (value) {
    return [value];
  }

  return [];
};


/**
 * A custom Ant form control built as it shown in the official documentation
 * https://ant.design/components/form/#components-form-demo-customized-form-controls
 * Based on built-in Tag https://ant.design/components/tag/#components-tag-demo-control
 */
const CitationControl = ({ value, label, removeAll, onChange, agentType = "contact", array = true }) => {
  const [citations, setCitations] = useState(() => stringToArray(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setCitations(stringToArray(value));
  }

  const [formVisible, setFormVisible] = useState(false);
  const [citationForEdit, setCitationForEdit] = useState(null);
  const [indexForEdit, setIndexForEdit] = useState(null);

  const triggerChange = (changedValue) => {
    if (onChange) {
      onChange(changedValue);
    }
  };

  const handleClose = (e, removedTag) => {
    if (e) {
      e.preventDefault();
    }
    const newCitations = citations.filter((tag) => tag !== removedTag);
    setCitations(newCitations);
    triggerChange(array ? newCitations : null);
  };

  const showForm = (citation) => {
    setCitationForEdit(citation || null);
    setFormVisible(true);
  };

  const onFormSubmit = async (citation) => {
    const newCitations = !_.isNull(indexForEdit)
      ? [
          ...citations.slice(0, indexForEdit),
          citation,
          ...citations.slice(indexForEdit),
        ]
      : [...citations, citation];

    setCitations(newCitations);
    setFormVisible(false);
    setCitationForEdit(null);
    setIndexForEdit(null);
    triggerChange(array ? newCitations : citation);

    return Promise.resolve();
  };

  const onDragEnd = (fromIndex, toIndex) => {
    const newCitations = [...citations];
    const citation = newCitations.splice(fromIndex, 1)[0];
    newCitations.splice(toIndex, 0, citation);
    if (onChange) {
      onChange(newCitations); // will get derived state from props
    }
  };

  const editAgent = (index, citation) => {
    setCitationForEdit(citation);
    setIndexForEdit(index);
    setFormVisible(true);
    handleClose(null, citation);
  };

  const dragProps = {
    onDragEnd: onDragEnd,
    nodeSelector: "li",
    handleSelector: "li",
  };

  return (
    <React.Fragment>
      <Row>
        <ol
          style={{
            height: "100%",
            listStyle: "none",
            paddingInlineStart: "0px",
          }}
        >
          {citations
            .filter((c) => !!c)
            .map((citation, index) => {
              const tagElem = (
                <li
                  key={index}
                  style={{
                    marginBottom: "4px",
                    height: "100%",
                  }}
                >
                  {" "}
                  <Tag
                    key={index}
                    style={{ height: "100%" }}
                    onClick={() => editAgent(index, citation)}
                    closable={true}
                    onClose={(e) => handleClose(e, citation)}
                  >
                    {citation.citation ? (
                      <div
                        style={{
                          display: "inline-block",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: citation.citation,
                        }}
                      ></div>
                    ) : (
                      <div
                        style={{
                          display: "inline-block",
                        }}
                      >
                        {citation.title}
                      </div>
                    )}
                  </Tag>
                </li>
              );
              return tagElem;
            })}
          {!formVisible && (array || citations.length === 0) && (
            <li
              style={{
                marginBottom: "4px",
                height: "100%",
              }}
            >
              <Tag onClick={() => showForm()} className={styles.newTagTall}>
                <PlusOutlined /> {label}
              </Tag>
            </li>
          )}
        </ol>
      </Row>

      <Modal
        width={1000}
        open={formVisible}
        footer={null}
        onCancel={() =>
          citationForEdit
            ? onFormSubmit(citationForEdit)
            : setFormVisible(false)
        }
        title={
          citationForEdit
            ? `Editing citation${
                citationForEdit.id ? " " + citationForEdit.id : ""
              }`
            : `New citation`
        }
      >
        <CslForm
          data={formVisible ? citationForEdit : null}
          onSubmit={onFormSubmit}
          onCancel={() =>
            citationForEdit
              ? onFormSubmit(citationForEdit)
              : setFormVisible(false)
          }
        />
      </Modal>
    </React.Fragment>
  );
};

export default CitationControl;
