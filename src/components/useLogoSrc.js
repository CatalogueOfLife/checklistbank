import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Resolve a logo image URL into a `src` usable by an <img> tag.
 *
 * For private datasets the logo endpoint requires the JWT bearer token, which
 * a plain <img src> request cannot carry (the token lives on axios.defaults,
 * not in a cookie). For those we fetch the image with axios as a blob — so the
 * Authorization header is sent — and expose an object URL instead.
 *
 * Public logos are returned as-is so they keep loading natively and stay
 * cacheable by the browser and Varnish.
 *
 * @param {string} url the logo endpoint URL
 * @param {boolean} authed whether the request must be authenticated (private)
 * @returns {{ src: string|null, error: boolean }}
 */
export default function useLogoSrc(url, authed) {
  const [src, setSrc] = useState(authed ? null : url || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    if (!url) {
      setSrc(null);
      return;
    }
    if (!authed) {
      setSrc(url);
      return;
    }
    let cancelled = false;
    let objectUrl;
    setSrc(null);
    axios
      .get(url, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, authed]);

  return { src, error };
}
