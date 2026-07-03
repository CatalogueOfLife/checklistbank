import React from "react";
import { Select, Input, Button, Typography } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import _ from "lodash";

const { Text } = Typography;

// The major Linnean ranks offered as higher-taxa hints. Genus is intentionally
// excluded — it is derivable from the binomial names themselves, so hinting it
// adds nothing. These line up with the match API classification hint params.
const MAJOR_RANKS = ["kingdom", "phylum", "class", "order", "family"];

// Controls that let the user pin a single nomenclatural code and one or more
// higher taxa (name + major rank) which get applied to every input record of the
// Simple data entry form and the synchronous CSV/TSV upload. See
// docs/superpowers/specs/2026-07-03-namematch-fixed-code-and-higher-taxa-design.md
const NameMatchContext = ({
  code,
  onCodeChange,
  higherTaxa,
  onHigherTaxaChange,
  nomCode,
  disabled,
}) => {
  const rows =
    higherTaxa && higherTaxa.length ? higherTaxa : [{ rank: undefined, name: "" }];

  const updateRow = (index, patch) => {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onHigherTaxaChange(next);
  };

  const addRow = () => onHigherTaxaChange([...rows, { rank: undefined, name: "" }]);

  const removeRow = (index) => {
    const next = rows.filter((_r, i) => i !== index);
    onHigherTaxaChange(next.length ? next : [{ rank: undefined, name: "" }]);
  };

  const chosenRanks = rows.map((r) => r.rank).filter(Boolean);

  return (
    <div>
      <Text strong>Nomenclatural code</Text>
      <Select
        style={{ width: "100%", marginTop: 4 }}
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="Apply one code to all names (optional)"
        value={code || undefined}
        disabled={disabled}
        onChange={(value) => onCodeChange(value || null)}
        options={(nomCode || []).map((c) => ({
          value: c.name,
          label: `${_.startCase(c.name)}${c.acronym ? ` · ${c.acronym}` : ""}`,
        }))}
      />

      <Text strong style={{ display: "block", marginTop: 12 }}>
        Higher taxa
      </Text>
      <Text type="secondary" style={{ fontSize: "0.85em" }}>
        Applied as a classification hint to every name.
      </Text>
      {rows.map((row, index) => (
        <div
          key={index}
          style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}
        >
          <Select
            style={{ width: 120, flex: "0 0 120px" }}
            placeholder="Rank"
            value={row.rank}
            disabled={disabled}
            onChange={(value) => updateRow(index, { rank: value })}
            options={MAJOR_RANKS.map((r) => ({
              value: r,
              label: _.startCase(r),
              disabled: r !== row.rank && chosenRanks.includes(r),
            }))}
          />
          <Input
            style={{ flex: "1 1 auto" }}
            placeholder="Taxon name, e.g. Animalia"
            value={row.name}
            disabled={disabled}
            onChange={(e) => updateRow(index, { name: e.target.value })}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            disabled={disabled}
            onClick={() => removeRow(index)}
            aria-label="Remove higher taxon"
          />
        </div>
      ))}
      <Button
        type="link"
        icon={<PlusOutlined />}
        disabled={disabled || rows.length >= MAJOR_RANKS.length}
        onClick={addRow}
        style={{ paddingLeft: 0, marginTop: 4 }}
      >
        Add higher taxon
      </Button>
    </div>
  );
};

export default NameMatchContext;
