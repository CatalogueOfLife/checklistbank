import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { areaPath, linkedAreaSvg } from "./gazetteers";
import styles from "./GazetteerImage.module.css";

// A drawn world map of a gazetteer, with its areas as links.
// fallback: rendered in place of an image that isn't a valid SVG.
const GazetteerImage = ({ name, svg, fallback = null }) => {
  const navigate = useNavigate();
  const html = useMemo(() => linkedAreaSvg(svg, (id) => areaPath(name, id)), [name, svg]);

  // They are real links for a new tab and the keyboard, but stay inside the app.
  const onClick = (e) => {
    const link = e.target.closest("a");
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(link.getAttribute("href"));
  };

  if (!html) return fallback;
  return (
    <div className={styles.image} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default GazetteerImage;
