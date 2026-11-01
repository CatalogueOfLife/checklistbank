import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { NARROW_COLUMNS, RANKS, buildScale, lighten } from "./geotimeLayout";
import styles from "./GeoTimeScale.module.css";

const describe = ({ name, type, start, end }) => `${name}, ${type}: ${start} to ${end} Ma`;

// items: the geotime vocabulary as returned by the API
const GeoTimeScale = ({ items, location, selected, onSelect }) => {
  const { cells, leaves } = useMemo(() => buildScale(items), [items]);

  return (
    <div className={styles.scroller}>
      <div className={styles.table}>
        <div className={styles.header}>
          {RANKS.map((rank, i) => (
            <div key={rank} className={i < NARROW_COLUMNS ? styles.rotatedHeading : undefined}>
              {rank}
            </div>
          ))}
          <div>Ma</div>
        </div>
        <div className={styles.body}>
          {cells.map(({ item, color, colStart, colEnd, rowStart, rowEnd, rotated }) => (
            <Link
              key={item.name}
              id={item.name}
              to={{ search: location.search, hash: `#${encodeURIComponent(item.name)}` }}
              replace
              onClick={onSelect}
              title={describe(item)}
              className={[
                styles.cell,
                rowStart === 0 ? styles.first : "",
                item.parent ? "" : styles.root,
                rotated ? styles.rotated : "",
                rowEnd - rowStart === 1 ? styles.single : "",
                item.name === selected ? styles.selected : "",
              ].join(" ")}
              style={{
                gridColumn: `${colStart + 1} / ${colEnd + 1}`,
                gridRow: `${rowStart + 1} / ${rowEnd + 1}`,
                background: lighten(color),
              }}
            >
              <span className={styles.label}>{item.name}</span>
            </Link>
          ))}
          {leaves.map((leaf, i) => (
            <div
              key={leaf.name}
              className={styles.boundary}
              style={{ gridColumn: RANKS.length + 1, gridRow: i + 1 }}
            >
              {i === 0 && <span className={styles.top}>{leaf.end}</span>}
              <span className={styles.bottom}>{leaf.start}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeoTimeScale;
