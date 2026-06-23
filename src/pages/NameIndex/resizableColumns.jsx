import React, { useState } from "react";
import { Resizable } from "react-resizable";

// Draggable column-header cell. Columns without a fixed width render as a plain
// <th> (they just flex to fill the remaining space and aren't resizable).
const ResizableTitle = (props) => {
  const { onResize, width, ...restProps } = props;
  if (!width) return <th {...restProps} />;
  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export const resizableComponents = { header: { cell: ResizableTitle } };

// Wire a column array for drag-to-resize. Each cell clips with a CSS ellipsis
// sized to the current column width (no hard character-count truncation), and
// widths live in local state so a drag sticks. Pass the result to <Table
// columns=> together with `components={resizableComponents}`.
export const useResizableColumns = (columns) => {
  const [widths, setWidths] = useState(() => columns.map((c) => c.width));
  const handleResize =
    (index) =>
    (e, { size }) => {
      setWidths((prev) => {
        const next = [...prev];
        next[index] = size.width;
        return next;
      });
    };
  return columns.map((col, index) => ({
    ellipsis: { showTitle: true },
    ...col,
    width: widths[index],
    onHeaderCell: (column) => ({
      width: column.width,
      onResize: handleResize(index),
    }),
  }));
};
