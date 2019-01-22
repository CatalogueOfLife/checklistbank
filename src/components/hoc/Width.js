/**
 * This source code partially taken from here https://github.com/leanjscom/react-width
 * And idea is the same as here https://stackoverflow.com/questions/36862334/get-viewport-window-height-in-reactjs
 * More details here https://www.hawatel.com/blog/handle-window-resize-in-react/
 * The reason is that window.innerWidth works incorrect initially returning wrong value on first detection
 * That is why I took this solution https://stackoverflow.com/a/26191207/2185053
 */

import React from 'react';

export const EXTRA_LARGE = 4;
export const LARGE = 3;
export const MEDIUM = 2;
export const SMALL = 1;

export class Width extends React.Component {
  static EXTRA_LARGE = EXTRA_LARGE;
  static LARGE = LARGE;
  static MEDIUM = MEDIUM;
  static SMALL = SMALL;

  // Like a Bootstrap Grid Layout
  static EXTRA_LARGE_WIDTH = 1200;
  static LARGE_WIDTH = 992;
  static MEDIUM_WIDTH = 768;
  // static SMALL_WIDTH = 576;

  constructor(props) {
    super(props);

    this.deferTime = null;
    this.resizeInterval = 166;
    this.state = { width: null };
  }

  componentDidMount() {
    if (window) {
      window.addEventListener('resize', this.handleResize);
    }
    this.updateWidth();
  }

  componentWillUnmount() {
    if (window) {
      window.removeEventListener('resize', this.handleResize);
    }
    clearTimeout(this.deferTime);
  }

  handleResize = () => {
    clearTimeout(this.deferTime);
    this.deferTime = setTimeout(
      () => {
        this.updateWidth();
      },
      this.resizeInterval
    );
  };

  updateWidth = () => {
    let innerWidth = this.getViewportWidth();
    let width;

    if (innerWidth >= Width.EXTRA_LARGE_WIDTH) {
      width = Width.EXTRA_LARGE;
    } else if (innerWidth >= Width.LARGE_WIDTH) {
      width = Width.LARGE;
    } else if (innerWidth >= Width.MEDIUM_WIDTH) {
      width = Width.MEDIUM;
    } else {
      width = Width.SMALL;
    }

    if (width !== this.state.width) {
      this.setState({
        width
      });
    }
  };

  getViewportWidth() {
    return  window.innerWidth && document.documentElement.clientWidth ?
      Math.min(window.innerWidth, document.documentElement.clientWidth) :
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.querySelector('body').clientWidth;
  }

  render() {
    return this.props.children(this.state.width);
  }
}

const withWidth = () => WrappedComponent => {
  class WithWidth extends Width {
    render() {
      return <WrappedComponent {...this.props} width={this.state.width}/>;
    }
  }

  return WithWidth;
};

export default withWidth;