import React from "react";
import axios from "axios";
import config from "../../config";
import { Row, Col, Icon, Radio, Popover } from "antd";
import locales from "../components/csl/locales";
import styles from "../csl/styles";
const CSL = require("citeproc");
const RadioGroup = Radio.Group;

// axios('https://api.github.com/repos/citation-style-language/styles/contents').then(res => console.log(res))

/*
// Library of Cornell Conservation Agriculture
  var chosenLibraryItems = "https://api.zotero.org/groups/459003/items?format=csljson&limit=6&itemType=journalArticle";
  // Chicago Manual of Style (Full Note)
  var chosenStyleID = "chicago-fullnote-bibliography";

  // Fetch citation data
  var xhr = new XMLHttpRequest();
  xhr.open('GET', chosenLibraryItems, false);
  xhr.send(null);
  var citationData = JSON.parse(xhr.responseText);

  // Refactor citation data for keyed access
  var citations = {};
  var itemIDs = [];
  for (var i=0,ilen=citationData.items.length;i<ilen;i++) {
    var item = citationData.items[i];
    if (!item.issued) continue;
    if (item.URL) delete item.URL;
    var id = item.id;
    citations[id] = item;
    itemIDs.push(id);
  }

  // Initialize a system object
  citeprocSys = {
    retrieveLocale: function (lang){
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://raw.githubusercontent.com/Juris-M/citeproc-js-docs/master/locales-' + lang + '.xml', false);
      xhr.send(null);
      return xhr.responseText;
    },
    retrieveItem: function(id){
      return citations[id];
    }
  };

  // Instantiate processor
  function getProcessor(styleID) {
    // Get the CSL style as a serialized string of XML
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/citation-style-language/styles/master/' + styleID + '.csl', false);
    xhr.send(null);
    var styleAsText = xhr.responseText;
    var citeproc = new CSL.Engine(citeprocSys, styleAsText);
    return citeproc;
  };


  // This runs at document ready, and renders the bibliography
  function processorOutput() {
    ret = '';
    var citeproc = getProcessor(chosenStyleID);
    citeproc.updateItems(itemIDs);
    var bibResult = citeproc.makeBibliography();
    return bibResult[1].join('\n');
  }

  */

class CslReferences extends React.Component {
  constructor(props) {
    super(props);
    const defaultStyleKey = "council-of-science-editors";
    this.state = {
      csl: "",
      style: styles[defaultStyleKey],
      styleKey: defaultStyleKey,
    };
  }

  processCsl = (references, style) => {
    const citeprocSys = {
      retrieveLocale: function (lang) {
        return locales[lang];
      },
      retrieveItem: function (id) {
        return { ...references[id].csl, id: id };
      },
    };

    const citeproc = new CSL.Engine(citeprocSys, style);
    citeproc.updateItems(Object.keys(references));
    const bibResult = citeproc.makeBibliography();
    return Promise.resolve(bibResult[1].join("\n"));
  };
  componentDidMount = () => {
    const { references } = this.props;
    this.processCsl(references, this.state.style).then((csl) =>
      this.setState({ csl })
    );
  };

  onStyleChange = (evt) => {
    const styleKey = evt.target.value;
    localStorage.setItem("colplus_preferred_csl_style", styleKey);
    const { references } = this.props;
    this.setState({ style: styles[styleKey], styleKey: styleKey }, () =>
      this.processCsl(references, this.state.style).then((csl) =>
        this.setState({ csl })
      )
    );
  };

  render = () => {
    const { style } = this.props;
    const { csl } = this.state;
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px",
    };
    return (
      <Row style={{ marginLeft: "-48px", marginTop: "-8px" }}>
        <Col span={22}>
          <div dangerouslySetInnerHTML={{ __html: csl }} />
        </Col>
        <Col span={2} style={{ textAlign: "right" }}>
          <Popover
            placement="leftTop"
            title="Csl style"
            content={
              <RadioGroup
                onChange={this.onStyleChange}
                value={this.state.styleKey}
              >
                {Object.keys(styles)
                  .sort()
                  .map((key) => (
                    <Radio style={radioStyle} value={key}>
                      {key.replace(/[_-]/g, " ")}
                    </Radio>
                  ))}
              </RadioGroup>
            }
            trigger="click"
          >
            <Icon type="setting" style={{ marginTop: "0.7em" }} />
          </Popover>
        </Col>
      </Row>
    );
  };
}

export default CslReferences;
