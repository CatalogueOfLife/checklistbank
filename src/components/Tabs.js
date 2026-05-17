import React from "react";
import { Tabs as AntdTabs } from "antd";

// antd 6 deprecated Tabs.TabPane in favour of the `items` array prop. This
// thin wrapper preserves the old JSX-with-children API by walking the
// children once and forwarding as `items`. Pages keep their <Tabs><TabPane …/>
// markup while the deprecation warning goes away.
const tabChildrenToItems = (children) => {
  const items = [];
  React.Children.forEach(children, (child) => {
    if (child == null || child === false || child === true) return;
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      items.push(...tabChildrenToItems(child.props.children));
      return;
    }
    if (child.type === AntdTabs.TabPane) {
      items.push({
        key: child.key,
        label: child.props.tab,
        children: child.props.children,
        disabled: child.props.disabled,
        closable: child.props.closable,
        closeIcon: child.props.closeIcon,
        forceRender: child.props.forceRender,
      });
    }
  });
  return items;
};

const Tabs = ({ children, items, ...rest }) => (
  <AntdTabs items={items ?? tabChildrenToItems(children)} {...rest} />
);
Tabs.TabPane = AntdTabs.TabPane;

export default Tabs;
