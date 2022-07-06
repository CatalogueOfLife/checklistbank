import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import withContext from "../../components/hoc/withContext";
import axios from "axios";
import config from "../../config";
import VerbatimPresentation from "../../components/VerbatimPresentation";
import { Skeleton, Space , Tabs} from "antd";
import _ from "lodash"
import withWidth, { SMALL } from "../../components/hoc/Width";

const compose = _.flowRight
const { TabPane } = Tabs;

const TYPES = {
  "col:Taxon": "col:ID",
  "col:NameUsage": "col:ID",
  "acef:AcceptedSpecies": "acef:AcceptedTaxonID",
  "acef:AcceptedInfraSpecificTaxa": "acef:AcceptedTaxonID",
  "dwc:Taxon": "dwca:ID",
  "col:Name": "col:ID",
  "col:Reference": "col:ID",
  "gbif:Multimedia": "dwca:ID"
};

const Verbatim = ({
  verbatimKey,
  addError,
  location,
  match: {
    params: { key: datasetKey },
  },
  termsMapReversed,
  width
}) => {
  const [loading, setLoading] = useState(false);
  const [verbatimRecords, setVerbatimRecords] = useState({});
  const [type, setType] = useState(null);
  const [unknownTypeErrMsg, setUnknownTypeErrMsg] = useState(null);
 

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await axios(
          `${config.dataApi}dataset/${datasetKey}/verbatim/${verbatimKey}`
        );

        const record = res?.data || {};
        const type = res?.data?.type;
        setType(type)
        const primaryKey = TYPES[res?.data?.type] || null;
        if (!primaryKey) {
          setUnknownTypeErrMsg(`Unknown verbatim Taxon type: ${type}`);
        } else if (_.get(termsMapReversed, `${type}.${primaryKey}`)) {
          const foreignKeys = _.get(termsMapReversed, `${type}.${primaryKey}`);

          const types = [
            ...new Set(
              foreignKeys.map(
                (p) => `type=${encodeURIComponent(p.split(".")[0])}`
              )
            ),
          ];
          const terms = foreignKeys.map(
            (p) => `${p.split(".")[1]}=${encodeURIComponent(record?.terms?.[primaryKey])}`
          );
          const linkedRecordsRes = await axios(
            `${config.dataApi}dataset/${datasetKey}/verbatim?${types.join(
              "&"
            )}&${terms.join("&")}&termOp=OR&limit=1000`
          );
          setVerbatimRecords(_.groupBy([record, ...(linkedRecordsRes?.data?.result?.filter(r => r.id !== record.id && r.file !== record.file) || [])], 'type'));
          setLoading(false);
        }
      } catch (err) {
        addError(err);
        setLoading(false);
      }
    };
    init();
  }, []);

  return loading ? (
    <Skeleton />
  ) : (
    <>

      {unknownTypeErrMsg
        ? unknownTypeErrMsg
        : <Tabs defaultActiveKey="1" tabPosition={width <= SMALL ? "top" : "right"}>
            {Object.keys(verbatimRecords).map(key => 
                <TabPane tab={key} key={key}>
                  {verbatimRecords[key].map((v) => (
            <VerbatimPresentation
                    style={{marginBottom: "10px"}}
              key={v.id}
              record={v}
              datasetKey={v.datasetKey}
              verbatimKey={v.id}
              basicHeader={true}
              location={location}
            />
          ))}
          </TabPane>
            
        
        )}
    </Tabs>      
        }
    </>
  );
};
const mapContextToProps = ({ addError, termsMapReversed }) => ({
  addError,
  termsMapReversed,
});

export default compose(
  withWidth(),
  withContext(mapContextToProps),
  withRouter
)(Verbatim);

//export default withContext(mapContextToProps)(withRouter(Verbatim));
