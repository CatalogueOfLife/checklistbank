import React, { useEffect, useState } from "react";
import { Image, Button, Skeleton, Modal, Typography } from "antd";
import _ from "lodash";
import LicenseIcon from "../../components/LicenseIcon";
import { cachedImage, captionText } from "./taxonMediaUtil";
import { LinkOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

const fallback =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg==";

const PAGE_SIZE = 10;
const THUMB = 180;

// antd Image that walks an ordered list of candidate sources, advancing to the
// next on load error. The GBIF image cache 404s on some sources (e.g. Wikimedia
// Special:FilePath redirects), so we fall back to the original URL before
// finally showing the data-URI placeholder.
const FallbackImage = ({ candidates, ...rest }) => {
  const srcs = candidates.filter(Boolean);
  const [idx, setIdx] = useState(0);
  return (
    <Image
      {...rest}
      src={srcs[idx] || fallback}
      fallback={fallback}
      onError={() => setIdx((i) => (i < srcs.length - 1 ? i + 1 : i))}
    />
  );
};

const MediaThumb = ({ item, onOpen }) => {
  return (
    <div style={{ width: THUMB }}>
      <div onClick={onOpen} style={{ cursor: "pointer", lineHeight: 0 }}>
        <FallbackImage
          candidates={[
            item.thumbnail,
            cachedImage(item.url, "x360"),
            item.url,
          ]}
          preview={false}
          alt={item.title || ""}
          width={THUMB}
          height={THUMB}
          style={{ objectFit: "cover", borderRadius: 4 }}
          placeholder={
            <Skeleton.Image active style={{ width: THUMB, height: THUMB }} />
          }
        />
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 12,
          color: "rgba(0,0,0,0.45)",
          lineHeight: 1.3,
          maxHeight: "2.6em",
          overflow: "hidden",
        }}
      >
        {captionText(item)}
        {item.license && (
          <>
            {" "}
            <LicenseIcon value={item.license} />
          </>
        )}
        {item.link && (
          <>
            {" "}
            <a href={item.link} target="_blank" rel="noreferrer">
              <LinkOutlined />
            </a>
          </>
        )}
      </div>
    </div>
  );
};

const MediaModal = ({ images, index, onClose, onPrev, onNext }) => {
  const open = index != null;
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onPrev, onNext]);

  const item = open ? images[index] : null;
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80vw"
      centered
      styles={{ body: { padding: 16, height: "80vh" } }}
      title={null}
    >
      {item && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                flex: "2 1 320px",
                minWidth: 280,
                minHeight: 0,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fafafa",
              }}
            >
              <FallbackImage
                key={item.url}
                candidates={[cachedImage(item.url, "fit-in/1600x1600"), item.url]}
                preview={false}
                alt={item.title || ""}
                // Viewport-relative cap: a percentage max-height against a
                // flex-stretched parent is unreliable, so tall (portrait)
                // figures would overflow the modal. 80vh body minus padding and
                // the counter row.
                style={{
                  maxHeight: "calc(80vh - 80px)",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
              <Button
                shape="circle"
                icon={<LeftOutlined />}
                onClick={onPrev}
                disabled={index === 0}
                style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}
              />
              <Button
                shape="circle"
                icon={<RightOutlined />}
                onClick={onNext}
                disabled={index === images.length - 1}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
            <div
              style={{
                flex: "1 1 280px",
                minWidth: 260,
                minHeight: 0,
                overflowY: "auto",
              }}
            >
              {item.title && (
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  {item.title}
                </Typography.Title>
              )}
              {item.rightsHolder && <div>©&nbsp;{item.rightsHolder}</div>}
              {item.capturedBy && <div>captured by {item.capturedBy}</div>}
              {item.captured && <div>{item.captured}</div>}
              {item.license && (
                <div style={{ marginTop: 4 }}>
                  <LicenseIcon value={item.license} /> {item.license}
                </div>
              )}
              {item.remarks && (
                <Typography.Paragraph style={{ marginTop: 8 }}>
                  {item.remarks}
                </Typography.Paragraph>
              )}
              {item.link && (
                <div style={{ marginTop: 8 }}>
                  <a href={item.link} target="_blank" rel="noreferrer">
                    open original <LinkOutlined />
                  </a>
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 12,
              color: "rgba(0,0,0,0.45)",
            }}
          >
            {index + 1} / {images.length}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ({ media }) => {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState(null);
  if (!_.isArray(media)) {
    return null;
  }
  const images = media.filter((m) => m.type === "image" && !!m.url);
  const onPrev = () =>
    setOpenIndex((i) => (i == null ? i : Math.max(0, i - 1)));
  const onNext = () =>
    setOpenIndex((i) => (i == null ? i : Math.min(images.length - 1, i + 1)));

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {images.slice(0, limit).map((item, idx) => (
          <MediaThumb
            key={item.url}
            item={item}
            onOpen={() => setOpenIndex(idx)}
          />
        ))}
      </div>
      {images.length > limit && (
        <div style={{ textAlign: "right", marginTop: 12 }}>
          {limit > PAGE_SIZE && (
            <Button
              style={{ marginRight: 8 }}
              onClick={() => setLimit(PAGE_SIZE)}
            >
              Show fewer
            </Button>
          )}
          <Button onClick={() => setLimit(limit + PAGE_SIZE)}>Show more</Button>
        </div>
      )}
      <MediaModal
        images={images}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onPrev={onPrev}
        onNext={onNext}
      />
    </>
  );
};
