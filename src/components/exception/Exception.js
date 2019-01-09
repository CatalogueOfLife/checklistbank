import React, { createElement } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';

// Config
import config from './config';
// Styles
import './index.css';

/**
 * Base Exception Components
 * @param type - Exception type, 404 by default
 * @param title - title text, code of an exception by default
 * @param desc - description of an exception
 * @param img - optional image to display on a page of exception
 * @param linkElement - a tag for a back button
 * @param backText - a text to display on a back button
 * @param redirect - URL for a back button, home page by default
 */
class Exception extends React.PureComponent {
  static defaultProps = {
    redirect: '/'
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { backText, linkElement = 'a', type, title, desc, img, redirect } = this.props;
    const pageType = type in config ? type : '404';

    return (
      <div className="exception">
        <div className="imgBlock">
          <div
            className="imgEle"
            style={{ backgroundImage: `url(${img || config[pageType].img})` }}
          />
        </div>
        <div className="content">
          <h1>{title || config[pageType].title || type}</h1>
          <div className="desc">{desc || config[pageType].desc}</div>
          {backText && (
            <div className="actions">
              {createElement(
                linkElement,
                { to: redirect, href: redirect },
                <Button type="primary">{backText}</Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

Exception.propTypes = {
  type: PropTypes.string.isRequired,
  title: PropTypes.string,
  desc: PropTypes.string,
  img: PropTypes.string,
  linkElement: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  backText: PropTypes.string,
  redirect: PropTypes.string
};

export default Exception;
