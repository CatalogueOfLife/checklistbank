import React from "react";
import { Radio } from "antd";

// a radio input must not get null as its value, so inherit is a string here and null outside
const INHERIT = "inherit";

// Inherit (null) / yes / no for a nullable boolean setting. A plain checkbox would send an
// explicit false once touched, and an explicit value overrides every sector profile.
const TriStateRadio = ({ value, onChange, yes = "yes", no = "no", inherited, disabled }) => (
  <Radio.Group
    value={value ?? INHERIT}
    onChange={(e) => onChange?.(e.target.value === INHERIT ? null : e.target.value)}
    optionType="button"
    buttonStyle="solid"
    disabled={disabled}
  >
    <Radio value={INHERIT}>{inherited ? `Inherit (${inherited})` : "Inherit"}</Radio>
    <Radio value={true}>{yes}</Radio>
    <Radio value={false}>{no}</Radio>
  </Radio.Group>
);

export default TriStateRadio;
