import * as React from 'react';
import { useState } from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Tooltip, Button } from 'antd';


const PopconfirmMultiOption = ({
  transitionName = 'zoom-big',
  placement = 'top',
  trigger = 'click',
  okType = 'primary',
  icon = <ExclamationCircleFilled />,
  disabled = false,
  open,
  defaultOpen,
  onConfirm,
  onCancel,
  onOpenChange,
  okButtonProps,
  cancelButtonProps,
  title,
  cancelText,
  okText,
  actions,
  ...restProps
}) => {
  const [visible, setVisibleState] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevDefaultOpen, setPrevDefaultOpen] = useState(defaultOpen);

  if (open !== undefined && open !== prevOpen) {
    setPrevOpen(open);
    setVisibleState(open);
  } else if (open === undefined && defaultOpen !== prevDefaultOpen) {
    setPrevDefaultOpen(defaultOpen);
    setVisibleState(defaultOpen);
  }

  const setVisible = (v, e) => {
    if (open === undefined) {
      setVisibleState(v);
    }
    if (onOpenChange) {
      onOpenChange(v, e);
    }
  };

  const handleConfirm = (e) => {
    setVisible(false, e);
    if (onConfirm) {
      onConfirm(e);
    }
  };

  const handleCancel = (e) => {
    setVisible(false, e);
    if (onCancel) {
      onCancel(e);
    }
  };

  const onVisibleChange = (v) => {
    if (disabled) {
      return;
    }
    setVisible(v);
  };

  const renderOverlay = () => {
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
            <Button onClick={handleCancel} size="small" {...cancelButtonProps}>
              {cancelText || 'Cancel' }
            </Button>
           {onConfirm && <Button onClick={handleConfirm} type={okType} size="small" {...okButtonProps}>
              {okText || 'OK'}
            </Button>}
            {actions && actions.map(a => {
              // antd 6 dropped Button type="danger" — translate it to the
              // `danger` boolean prop so existing call sites that pass
              // `type: "danger"` still render red.
              const isDanger = a.type === 'danger';
              return (
                <Button key={a.text} disabled={a?.disabled} onClick={(e) => {
                    setVisible(false, e);
                    if (a.action) {
                        a.action(e);
                      }

                }} type={isDanger ? 'primary' : (a.type || 'primary')} danger={isDanger} size="small" >
                {a.text}
              </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const overlay = renderOverlay();

  return (
    <Tooltip
      {...restProps}
      transitionName={transitionName}
      trigger={trigger}
      classNames={{ root: "popover-multi" }}
      placement={placement}
      onOpenChange={onVisibleChange}
      open={visible}
      overlay={overlay}
    />
  );
};


export default PopconfirmMultiOption;
