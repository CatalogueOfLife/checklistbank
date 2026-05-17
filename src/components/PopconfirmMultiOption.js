import * as React from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Tooltip, Button } from 'antd';


class Popconfirm extends React.Component{
  static defaultProps = {
    transitionName: 'zoom-big',
    placement: 'top' ,
    trigger: 'click' ,
    okType: 'primary' ,
    icon: <ExclamationCircleFilled />,
    disabled: false,
  };

  static getDerivedStateFromProps(nextProps) {
    if ('open' in nextProps) {
      return { visible: nextProps.open };
    } else if ('defaultOpen' in nextProps) {
      return { visible: nextProps.defaultOpen };
    }
    return null;
  }


  constructor(props) {
    super(props);

    this.state = {
      visible: props.open,
    };
  }

  getPopupDomNode = () => {
    return this.tooltip.getPopupDomNode();
  }

  onConfirm = (e) => {
    this.setVisible(false, e);

    const { onConfirm } = this.props;
    if (onConfirm) {
      onConfirm.call(this, e);
    }
  };

  onCancel = (e) => {
    this.setVisible(false, e);

    const { onCancel } = this.props;
    if (onCancel) {
      onCancel.call(this, e);
    }
  };

  onVisibleChange = (visible) => {
    const { disabled } = this.props;
    if (disabled) {
      return;
    }
    this.setVisible(visible);
  };

  setVisible = (visible, e) => {
    const props = this.props;
    if (!('open' in props)) {
      this.setState({ visible });
    }

    const { onOpenChange } = props;
    if (onOpenChange) {
      onOpenChange(visible, e);
    }
  }

  saveTooltip = (node) => {
    this.tooltip = node;
  };

  renderOverlay = () => {
    const {
      okButtonProps,
      cancelButtonProps,
      title,
      cancelText,
      okText,
      okType,
      icon,
      actions,
      onConfirm
    } = this.props;
    return (
      <div >
        <div className={`ant-popover-inner-content`}>
          <div className={`ant-popover-message`}>
            {icon}
            <div className={`ant-popover-message-title`}>{title}</div>
          </div>
          <div
            className="popover-multi-buttons"
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              justifyContent: 'flex-end',
              gap: '4px',
              marginTop: '8px',
            }}
          >
            <Button onClick={this.onCancel} size="small" {...cancelButtonProps}>
              {cancelText || 'Cancel' }
            </Button>
           {onConfirm && <Button onClick={this.onConfirm} type={okType} size="small" {...okButtonProps}>
              {okText || 'OK'}
            </Button>}
            {actions && actions.map(a =>
            <Button key={a.text} disabled={a?.disabled} onClick={(e) => {
                this.setVisible(false, e);
                if (a.action) {
                    a.action.call(this, e);
                  }

            }} type={a.type || 'primary'} size="small" >
            {a.text}
          </Button>
                )}
          </div>
        </div>
      </div>
    );
  };

  render = () => {
    const { placement, ...restProps } = this.props;

    const overlay = this.renderOverlay();

    return (
      <Tooltip
        {...restProps}
        classNames={{ root: "popover-multi" }}
        placement={placement}
        onOpenChange={this.onVisibleChange}
        open={this.state.visible}
        overlay={overlay}
        ref={this.saveTooltip}
      />
    );
  };

  
}


export default Popconfirm;