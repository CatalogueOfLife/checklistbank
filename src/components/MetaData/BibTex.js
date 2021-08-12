import React from "react";
import axios from "axios";
import config from "../../config";

const BibTex = ({ datasetKey }) => {
  const saveFile = async (blob) => {
    const a = document.createElement("a");
    a.download = "citation.bib";
    a.href = URL.createObjectURL(blob);
    a.addEventListener("click", () => {
      setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });
    a.click();
  };
  const getBibTex = async () => {
    const res = await axios.get(`${config.dataApi}dataset/${datasetKey}`, {
      responseType: "blob",
      headers: {
        Accept: "application/x-bibtex",
      },
    });
    saveFile(res.data);
  };
  return (
    <a onClick={getBibTex}>
      <img src="/images/bibtex_logo.png" height="40px" />
    </a>
  );
};

export default BibTex;
