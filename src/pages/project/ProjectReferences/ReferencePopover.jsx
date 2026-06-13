import { useState } from "react";
import { BookOutlined } from "@ant-design/icons";
import { Popover, Spin } from "antd";
import axios from "axios";
import config from "../../../config";
import _ from "lodash";
import linkify from 'linkify-html';

const ReferencePopover = ({ referenceId, datasetKey, references, remarks, placement, referenceIndexMap, trigger, maxInline = 4 }) => {
  const [reference, setReference] = useState([]);
  const [loading, setLoading] = useState(false);

  const getData = () => {
    if (referenceId) {
      const refIds = !_.isArray(referenceId) ? [referenceId] : [...new Set(referenceId)];
      const refList = [];
      setLoading(true);
      Promise.all(
        refIds.map((id) =>
          _.get(references, id)
            ? Promise.resolve(refList.push(references[id]))
            : axios(
              `${config.dataApi}dataset/${datasetKey}/reference/${id}`
            ).then((res) => refList.push(res.data))
        )
      ).then(() => {
        setReference(refList);
        setLoading(false);
      });
    }
  };

  const getContent = () => {
    if (loading) {
      return <Spin />;
    }
    const refContent = reference.length === 1
      ? <span dangerouslySetInnerHTML={{ __html: linkify(reference[0]?.citation || "") }}></span>
      : (
        <ul>
          {reference.map((r, i) => (
            <li key={r?.id || i}><span dangerouslySetInnerHTML={{ __html: linkify(r?.citation || "") }}></span></li>
          ))}
        </ul>
      );
    return (
      <>
        {refContent}
        {remarks && <p style={{ marginTop: 8, marginBottom: 0, fontStyle: "italic" }}>{remarks}</p>}
      </>
    );
  };

  const refIds = !_.isArray(referenceId) ? [referenceId] : [...new Set(referenceId)];
  // Cap the inline [n] markers so a name linked to many references does not
  // render an unreadable trail across the row. Overflow collapses into a "+N"
  // indicator; the hover popover still lists every citation.
  let icon =
    referenceIndexMap && _.get(referenceIndexMap, refIds[0])
      ? (() => {
          const shown = refIds.slice(0, maxInline);
          const overflow = refIds.length - shown.length;
          return [
            ...shown.map((r) => (
              <a
                key={r}
                className="col-reference-link"
                href={`#col-refererence-${r}`}
              >{`[${referenceIndexMap[r]}]`}</a>
            )),
            overflow > 0 ? (
              <span key="overflow" className="col-reference-link">{` +${overflow}`}</span>
            ) : null,
          ];
        })()
      : <BookOutlined style={{ cursor: "pointer" }} />;

  return referenceId ? (
    <Popover
      placement={placement || "left"}
      title="Reference"
      onOpenChange={(visible) => visible && getData()}
      content={
        <div
          style={{ maxWidth: "500px", maxHeight: "60vh", overflowY: "auto" }}
        >
          {getContent()}
        </div>
      }
      trigger={trigger || "hover"}
    >
      {icon}
    </Popover>
  ) : (
    ""
  );
};

export default ReferencePopover;
