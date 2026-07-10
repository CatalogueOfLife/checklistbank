import { normOp } from "./diffRows";

// A changed name shown as the full old name and full new name side by side:
//   before → after
// The old name is the equal+delete chunks (removed parts tinted red); the new
// name is the equal+insert chunks (added parts tinted green). Both names stay
// fully readable — unlike an interleaved word-diff, which becomes unreadable
// when deletes and inserts collide mid-word.
const sideSpans = (chunks, side) => {
  const drop = side === "before" ? "insert" : "delete"; // chunk op to omit
  const mark = side === "before" ? "namesdiff-del" : "namesdiff-ins";
  return chunks
    .filter((c) => normOp(c.op) !== drop)
    .map((c, i) => (
      <span key={i} className={normOp(c.op) === "equal" ? undefined : mark}>
        {c.text}
      </span>
    ));
};

const ChangedNameRow = ({ chunks = [], before, after }) => {
  // Fallback to the plain before/after strings if chunks are unavailable.
  if (!chunks.length) {
    return (
      <>
        <span className="namesdiff-before">{before}</span>
        <span className="namesdiff-arrow"> → </span>
        <span className="namesdiff-after">{after}</span>
      </>
    );
  }
  return (
    <>
      <span className="namesdiff-before">{sideSpans(chunks, "before")}</span>
      <span className="namesdiff-arrow"> → </span>
      <span className="namesdiff-after">{sideSpans(chunks, "after")}</span>
    </>
  );
};

export default ChangedNameRow;
