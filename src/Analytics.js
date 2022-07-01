import React, { useEffect, useState } from "react";
import {notification, Button, Row, Col} from "antd"
import { Router, Route, Switch, withRouter } from "react-router-dom";
import withContext from "./components/hoc/withContext";
import axios from "axios";
import config from "./config";
import ReactGA from 'react-ga4';

if(config.env === "dev"){
  ReactGA.initialize(config.ga4);
}

const Analytics = ({location, user}) => {
    const [consent, setConsent] = useState(false);
    const accepted = localStorage.getItem('clb_terms_consent_accepted');
    const rejected = localStorage.getItem('clb_terms_consent_rejected');
    const key = "consent";
    console.log(Date.now())
    
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", page: location.pathname });
    
      }, [location.pathname]);
    useEffect(() => {
        console.log(user)
      }, [user]);
     useEffect(()=>{
      setTimeout(() => {
        if(!consent){
          notification.warning({
            key,
            placement: 'bottomRight',
            message: 'Privacy statement',
            duration: 0,
            description:
              <>
              <Row>We use cookies</Row>
              <Row><Col flex="auto"></Col><Col><Button onClick={() => updateConsent(true)}>Accept</Button><Button onClick={() => updateConsent(false)} style={{marginLeft: "10px"}}>Reject</Button></Col></Row>
              
              </>,
          })
        }
      }, 2000);
     }, []) 
    
      const updateConsent = async (accepted) => {
        let settings = user?.settings ? {... user.settings} : {};
        let time = Date.now();
        if(accepted){
          delete settings.termsConsentRejected;
          settings.termsConsentAccepted = time;
        }
        if(!accepted){
          delete settings.termsConsentAccepted;
          settings.termsConsentRejected = time;
        }
        notification.close(key)

        try {
          await axios.put(`${config.dataApi}user/settings`, settings)
          notification.success({
            description: "Your privacy settings has been updated"
          })
        } catch (error) {
          notification.error({
            description: error?.message
          })
        }
        
      }
      return <></>
}

const mapContextToProps = ({ user }) => ({
  user
});
export default withContext(mapContextToProps)(withRouter(Analytics));