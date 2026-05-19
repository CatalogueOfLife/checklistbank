/**
 * This source code partially taken from here https://github.com/leanjscom/react-width
 * And idea is the same as here https://stackoverflow.com/questions/36862334/get-viewport-window-height-in-reactjs
 * More details here https://www.hawatel.com/blog/handle-window-resize-in-react/
 * The reason is that window.innerWidth works incorrect initially returning wrong value on first detection
 * That is why I took this solution https://stackoverflow.com/a/26191207/2185053
 */

import { useState, useEffect, useRef } from "react";

export const EXTRA_LARGE = 4;
export const LARGE = 3;
export const MEDIUM = 2;
export const SMALL = 1;

const EXTRA_LARGE_WIDTH = 1200;
const LARGE_WIDTH = 992;
const MEDIUM_WIDTH = 768;

function getViewportWidth() {
  return window.innerWidth && document.documentElement.clientWidth
    ? Math.min(window.innerWidth, document.documentElement.clientWidth)
    : window.innerWidth ||
        document.documentElement.clientWidth ||
        document.querySelector("body").clientWidth;
}

function classify(innerWidth) {
  if (innerWidth >= EXTRA_LARGE_WIDTH) return EXTRA_LARGE;
  if (innerWidth >= LARGE_WIDTH) return LARGE;
  if (innerWidth >= MEDIUM_WIDTH) return MEDIUM;
  return SMALL;
}

function useWidth() {
  const [width, setWidth] = useState(() => classify(getViewportWidth()));
  const deferTime = useRef(null);
  const resizeInterval = 166;

  useEffect(() => {
    const handleResize = () => {
      clearTimeout(deferTime.current);
      deferTime.current = setTimeout(() => {
        const next = classify(getViewportWidth());
        setWidth((prev) => (next !== prev ? next : prev));
      }, resizeInterval);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(deferTime.current);
    };
  }, []);

  return width;
}

export const Width = ({ children }) => {
  const width = useWidth();
  return children(width);
};

Width.EXTRA_LARGE = EXTRA_LARGE;
Width.LARGE = LARGE;
Width.MEDIUM = MEDIUM;
Width.SMALL = SMALL;
Width.EXTRA_LARGE_WIDTH = EXTRA_LARGE_WIDTH;
Width.LARGE_WIDTH = LARGE_WIDTH;
Width.MEDIUM_WIDTH = MEDIUM_WIDTH;

const withWidth = () => (WrappedComponent) => {
  const WithWidth = (props) => {
    const width = useWidth();
    return <WrappedComponent {...props} width={width} />;
  };
  return WithWidth;
};

export default withWidth;
