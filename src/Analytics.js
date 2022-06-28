import React, { useEffect } from "react";
import { Router, Route, Switch, withRouter } from "react-router-dom";
import config from "./config";
import ReactGA from 'react-ga4';

if(config.env === "dev"){
  ReactGA.initialize(config.ga4);
}

const Analytics = ({location}) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", page: location.pathname });
    
      }, [location.pathname]);

      return <></>
}

export default withRouter(Analytics);