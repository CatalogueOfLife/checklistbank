import { Card, theme } from "antd";

/**
 * A section of the dataset options, a small card whose header has the grey of the main layout.
 */
const SectionCard = ({ children, ...props }) => {
  const { token } = theme.useToken();
  return (
    <Card size="small" styles={{ header: { background: token.colorBgLayout } }} {...props}>
      {children}
    </Card>
  );
};

export default SectionCard;
