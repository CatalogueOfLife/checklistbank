import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Resolve a logo image URL into a `src` usable by an <img> tag.
 *
 * For private datasets the logo endpoint requires the JWT bearer token, which
 * a plain <img src> request cannot carry (the token lives on axios.defaults,
 * not in a cookie). For those we fetch the image with axios — so the
 * Authorization header is sent — and expose it as a data: URL. (A blob: object
 * URL would be simpler but the production CSP `img-src * data:` does not allow
 * the blob: scheme, whereas data: is whitelisted.)
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
    setSrc(null);
    axios
      .get(url, { responseType: "blob" })
      .then(
        (res) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(res.data);
          })
      )
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, authed]);

  return { src, error };
}
