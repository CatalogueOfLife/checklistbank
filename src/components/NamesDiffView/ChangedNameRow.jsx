import { normOp } from "./diffRows";

// Render a changed name's chunks inline: equal text plain, delete text
// red+strikethrough, insert text green+underline. Op is matched case-insensitively.
const opClass = { delete: "namesdiff-del", insert: "namesdiff-ins" };

const ChangedNameRow = ({ chunks = [] }) =>
  chunks.map((chunk, i) => {
    const cls = opClass[normOp(chunk.op)];
    return (
      <span key={i} className={cls}>
        {chunk.text}
      </span>
    );
  });

export default ChangedNameRow;
