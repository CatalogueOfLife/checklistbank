import React, { useEffect, useState, useRef } from "react";
import { notification, Button, Row, Col } from "antd";
import { Router, Route, Switch, withRouter } from "react-router-dom";
import withContext from "./components/hoc/withContext";
import { AppContext } from "./components/hoc/ContextProvider";
import axios from "axios";
import config from "./config";
import ReactGA from "react-ga4";

const { termsIssued } = config;



const Analytics = ({ location, user, loadTokenUser }) => {
  const sessionAccepted = localStorage.getItem("clb_terms_consent_accepted");
  const sessionRejected = localStorage.getItem("clb_terms_consent_rejected");

  const [accepted, setAccepted] = useState(
    sessionAccepted && Number(sessionAccepted) > termsIssued ? true : false
  );
  const [rejected, setRejected] = useState(
    sessionRejected && Number(sessionRejected) > termsIssued ? true : false
  );
  const [timeOutHandle, setTimeoutHandle] = useState(null);
  const [api, contextHolder] = notification.useNotification();

  const openNotification = () => {
    api.warning({
      key,
      placement: "bottomRight",
      closeIcon: <div></div>,
      message: "Cookies on ChecklistBank",
      duration: 0,
      description: (
        <AppContext.Consumer>
          {({ user: notificationUser }) => (
            <>
              <Row>
                ChecklistBank uses cookies and similar technologies for the
                purposes of statistical analysis and improving the friendliness
                and usability of our website. You may decline such non-essential
                cookies by selecting “Reject”.
              </Row>
              <Row style={{ marginTop: "10px" }}>
                <Col flex="auto"></Col>
                <Col>
                  <Button onClick={() => updateConsent(true, notificationUser)}>
                    Accept
                  </Button>
                  <Button
                    onClick={() => updateConsent(false, notificationUser)}
                    style={{ marginLeft: "10px" }}
                  >
                    Reject
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </AppContext.Consumer>
      ),
    });
  };

  const key = "consent";
  // console.log(Date.now());

  useEffect(() => {
    if (accepted && !rejected) {
      ReactGA.send({ hitType: "pageview", page: location.pathname });
    }
  }, [location.pathname]);
  useEffect(() => {
    if (user && user.settings) {
      const { settings } = user;
      if (
        settings.termsConsentAccepted &&
        Number(settings.termsConsentAccepted) > termsIssued
      ) {
        ReactGA.initialize(config.ga4);
        ReactGA.send({ hitType: "pageview", page: location.pathname });
        localStorage.setItem(
          "clb_terms_consent_accepted",
          settings.termsConsentAccepted
        );
        setAccepted(true);
        setRejected(false);
      }
      if (
        settings.termsConsentRejected &&
        Number(settings.termsConsentRejected) > termsIssued
      ) {
        localStorage.setItem(
          "clb_terms_consent_rejected",
          settings.termsConsentRejected
        );
        setRejected(true);
        setAccepted(false);
      }
    }
    // console.log(user)
  }, [user]);
  useEffect(() => {
    if ((accepted || rejected) && timeOutHandle) {
      clearTimeout(timeOutHandle);
    }
  }, [accepted, rejected, timeOutHandle]);
  useEffect(() => {
    let timeout = setTimeout(() => {
      openNotification();
    }, 5000);
    setTimeoutHandle(timeout);
  }, []);

  const updateConsent = async (consent, usr) => {
    if (usr) {
      updateUserConsent(consent);
    } else {
      let time = Date.now();
      if (consent) {
        localStorage.setItem("clb_terms_consent_accepted", time);
        localStorage.removeItem("clb_terms_consent_rejected");
        setAccepted(true);
        setRejected(false);
        ReactGA.initialize(config.ga4);
        ReactGA.send({ hitType: "pageview", page: location.pathname });
      }
      if (!consent) {
        localStorage.setItem("clb_terms_consent_rejected", time);
        localStorage.removeItem("clb_terms_consent_accepted");
        setRejected(true);
        setAccepted(false);
      }
      notification.close(key);
    }
  };

  const updateUserConsent = async (consent) => {
    let settings = user?.settings ? { ...user.settings } : {};
    let time = Date.now();
    if (consent) {
      ReactGA.initialize(config.ga4);
      ReactGA.send({ hitType: "pageview", page: location.pathname });
      delete settings.termsConsentRejected;
      settings.termsConsentAccepted = time;
    }
    if (!consent) {
      delete settings.termsConsentAccepted;
      settings.termsConsentRejected = time;
    }
    notification.close(key);

    try {
      await axios.put(`${config.dataApi}user/settings`, settings);
      notification.success({
        description: "Your privacy settings has been updated",
      });
      loadTokenUser();
    } catch (error) {
      notification.error({
        description: error?.message,
      });
    }
  };
  return <>{contextHolder}</>;
};

const mapContextToProps = ({ user, loadTokenUser }) => ({
  user,
  loadTokenUser,
});
export default withContext(mapContextToProps)(withRouter(Analytics));
