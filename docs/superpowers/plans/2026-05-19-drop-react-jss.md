# Drop `react-jss` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `react-jss` from ChecklistBank by converting all 12 `injectSheet` call sites to CSS Modules, then uninstalling the dependency.

**Architecture:** Each component's static JSS rules move to a sibling `*.module.css` file imported as a default `styles` object. Two pairs of near-duplicate rule sets are deduped into shared CSS modules (`newTag.module.css`, `borderedListItem.module.css`) consumed via the CSS Modules `composes:` keyword. The empty-`styles` wrapper around `BasicMenu` is removed entirely. The `<ThemeProvider>` in `App.js` and its dead `theme` constant are dropped (no component reads them).

**Tech Stack:** Vite 7.3 (native CSS Modules support), React 19, antd 6, plain CSS.

**Spec:** [`docs/superpowers/specs/2026-05-19-drop-react-jss-design.md`](../specs/2026-05-19-drop-react-jss-design.md)

---

## Conventions used in this plan

- **No automated tests for visual changes.** Verification is "navigate to a route in `npm start`, confirm nothing broke." If `npm start` isn't already running, start it once at the top: `npm start` (serves on `http://localhost:3000`). The dev server hot-reloads on save, so each step's verification is "open the named route, see the component still rendered, no console error."
- **Dev server connects to the prod API** by default (per `CLAUDE.md`). Any real public dataset works — examples below use **dataset key `3`** (Catalogue of Life Checklist). Substitute any dataset key you can browse.
- **Variable rename:** every conversion renames the destructured `classes` prop / `this.props.classes` to the imported `styles` module. Watch for class-component cases where `classes` is destructured from `this.props`.
- **Commit per task.** Each task lands one commit on `modernize-stack`.

---

## Task 1: Convert `PresentationGroupHeader` (simplest case — function component, 1 rule)

**Files:**
- Create: `src/components/PresentationGroupHeader.module.css`
- Modify: `src/components/PresentationGroupHeader.js`

- [ ] **Step 1: Create the CSS module**

`src/components/PresentationGroupHeader.module.css`:

```css
.header {
  margin: 0;
  padding: 10px;
  background: #f7f7f7;
  border: 1px solid #eee;
  border-width: 1px 0;
}
```

- [ ] **Step 2: Rewrite `PresentationGroupHeader.js`**

Replace the entire file with:

```js
import React from 'react';
import PropTypes from 'prop-types';

import Help from './Help';
import styles from './PresentationGroupHeader.module.css';

/**
 * Component responsible for data display in a read mode
 * @param title - Sub headline text
 * @param helpText - text to be displayed as a tip
 * @returns {*}
 * @constructor
 */
const PresentationGroupHeader = ({ title, helpText }) => {
  return (
    <h3 className={styles.header}>
      {title}
      <Help title={helpText} />
    </h3>
  );
};

PresentationGroupHeader.propTypes = {
  title: PropTypes.string.isRequired,
  helpText: PropTypes.object,
};

export default PresentationGroupHeader;
```

Notes:
- Removed `import injectSheet from 'react-jss'`.
- Removed `const styles = {...}`.
- Removed `injectSheet(styles)(...)` wrapper.
- Removed `classes` from the destructured props.
- `className={classes.header}` → `className={styles.header}`.

- [ ] **Step 3: Verify in dev server**

Navigate to `http://localhost:3000/dataset/3/about` and confirm the group headers ("Identifiers", "Geography", etc.) still render with the same grey banner. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PresentationGroupHeader.module.css src/components/PresentationGroupHeader.js
git commit -m "$(cat <<'EOF'
Convert PresentationGroupHeader to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Convert `Help` (function component, 2 rules)

**Files:**
- Create: `src/components/Help.module.css`
- Modify: `src/components/Help.js`

- [ ] **Step 1: Create the CSS module**

`src/components/Help.module.css`:

```css
.tip {
  color: rgba(0, 0, 0, 0.45);
  margin-left: 4px;
}

.icon {
  margin-top: 4px;
}
```

- [ ] **Step 2: Rewrite `Help.js`**

Replace the entire file with:

```js
import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import styles from './Help.module.css';

const Help = ({ title }) => {
  return (
    <React.Fragment>
      {title && <span className={styles.tip}>
        <Tooltip title={title}>
          <QuestionCircleOutlined className={styles.icon} />
        </Tooltip>
      </span>}
    </React.Fragment>
  );
};

Help.propTypes = {
  title: PropTypes.object
};

export default Help;
```

- [ ] **Step 3: Verify in dev server**

Navigate to `http://localhost:3000/dataset/3/about` and hover over any of the small `(?)` help icons next to a presentation row. The tooltip should appear; the icon should sit slightly lower than the row text (matches the 4px offset).

- [ ] **Step 4: Commit**

```bash
git add src/components/Help.module.css src/components/Help.js
git commit -m "$(cat <<'EOF'
Convert Help to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Convert `LayoutNew` (class component, 1 rule, multiple HOC wrappers)

**Files:**
- Create: `src/components/LayoutNew/LayoutNew.module.css`
- Modify: `src/components/LayoutNew/index.js`

- [ ] **Step 1: Create the CSS module**

`src/components/LayoutNew/LayoutNew.module.css`:

```css
.sider {
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
}
```

- [ ] **Step 2: Edit `src/components/LayoutNew/index.js`**

Three changes (all in this single file):

**(a) Imports — line 2:** remove `import injectSheet from "react-jss";` and add `import styles from "./LayoutNew.module.css";` near the other style/CSS imports (after the `"./menu.css"` import at line 14):

```js
// Before:
import injectSheet from "react-jss";
// ...
import "./menu.css";

// After:
// (injectSheet import removed)
// ...
import "./menu.css";
import styles from "./LayoutNew.module.css";
```

**(b) Remove the JS `styles` constant — lines 42–49:** delete the entire block:

```js
const styles = {
  sider: {
    overflow: "auto",
    height: "100vh",
    position: "fixed",
    left: 0,
  },
};
```

**(c) Stop destructuring `classes` and rename the one reference. Line 83** currently reads `classes,` inside the `this.props` destructure — delete that one line.

**Line 117** currently reads `className={classes.sider}` → change to `className={styles.sider}`.

**(d) Remove `injectSheet` from the compose chain — lines 426–431.** Before:

```js
export default compose(
  injectSheet(styles),
  withWidth(),
  withContext(mapContextToProps),
  withRouter
)(SiteLayout);
```

After:

```js
export default compose(
  withWidth(),
  withContext(mapContextToProps),
  withRouter
)(SiteLayout);
```

**(e) Also delete the stale commented-out line 433** (`//export default injectSheet(styles)(withWidth()(SiteLayout));`) since it references the now-deleted helper.

- [ ] **Step 3: Verify in dev server**

Visit `http://localhost:3000/`. The left-hand sider/menu should render exactly as before: fixed to the left, scrollable, 100vh tall. Resize the window so the sider collapses to the narrow icon-only version — that still works (it's antd-driven, not JSS-driven). Check console for errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/LayoutNew/LayoutNew.module.css src/components/LayoutNew/index.js
git commit -m "$(cat <<'EOF'
Convert LayoutNew to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Convert `UserMenu` (class component, descendant selector + fallback)

**Files:**
- Create: `src/components/LayoutNew/UserMenu/UserMenu.module.css`
- Modify: `src/components/LayoutNew/UserMenu/index.js`

The JSS source has:
```js
avatar: { "& img": { imageRendering: "crisp-edges", fallbacks: { imageRendering: "pixelated" } } }
```
which translates to plain stacked CSS declarations — the browser keeps whichever `image-rendering` value it recognizes, with the later one winning when both are valid.

- [ ] **Step 1: Create the CSS module**

`src/components/LayoutNew/UserMenu/UserMenu.module.css`:

```css
.avatar img {
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
```

- [ ] **Step 2: Edit `index.js`**

**(a) Remove JSS import (line 2):** delete `import injectSheet from "react-jss";`.

**(b) Add CSS module import** (insert just below the existing `import LoginForm from "./LoginForm";` at line 14):

```js
import styles from "./UserMenu.module.css";
```

**(c) Delete the JS `styles` constant — lines 29–38:**

```js
const styles = {
  avatar: {
    "& img": {
      imageRendering: "crisp-edges",
      fallbacks: {
        imageRendering: "pixelated",
      },
    },
  },
};
```

**(d) Remove `classes` from the destructure on line 109.** Before:
```js
const { classes, user, logout, catalogue } = this.props;
```
After:
```js
const { user, logout, catalogue } = this.props;
```

**(e) Replace the two `classes.` references:**
- Line 162: `className={classes.avatar}` → `className={styles.avatar}`
- Line 178: `className={classes.background}` → `className={styles.background}`

Note: `classes.background` is a dead reference — there is no `background` rule in the source JSS either. The whole `<div className={classes.background}>` wrapper currently renders an unstyled div. Keeping `styles.background` (which CSS Modules will resolve to `undefined` because the rule doesn't exist) preserves current behaviour (an unstyled div). Don't try to "fix" this — out of scope for this refactor.

**(f) Update the export line 198.** Before:
```js
export default withContext(mapContextToProps)(injectSheet(styles)(UserMenu));
```
After:
```js
export default withContext(mapContextToProps)(UserMenu);
```

- [ ] **Step 3: Verify in dev server**

Visit `http://localhost:3000/` while logged in. The avatar in the top-right corner should still render with the pixelated/crisp-edges look (no blurring). When logged out, the "Login" button renders normally. Open the dropdown — Logout / Profile items show.

If not logged in: log in with any test account (the avatar styling only applies to the logged-in path). Or open the React DevTools and inject `user` into context — but logging in is simpler.

- [ ] **Step 4: Commit**

```bash
git add src/components/LayoutNew/UserMenu/UserMenu.module.css src/components/LayoutNew/UserMenu/index.js
git commit -m "$(cat <<'EOF'
Convert UserMenu to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Introduce shared `newTag.module.css` and convert `TagControl`

This task creates the shared "new-tag" module that Tasks 5–8 all consume.

**Files:**
- Create: `src/components/newTag.module.css`
- Modify: `src/components/TagControl.js`

- [ ] **Step 1: Create the shared CSS module**

`src/components/newTag.module.css`:

```css
.newTag {
  background: #fff;
  border-style: dashed;
}

.newTagTall {
  composes: newTag;
  max-height: 22px;
}
```

- [ ] **Step 2: Edit `TagControl.js`**

**(a) Replace JSS import (line 5):**
```js
// Before:
import injectSheet from "react-jss";
// After:
import styles from "./newTag.module.css";
```

**(b) Delete the JS `styles` constant — lines 17–22:**

```js
const styles = {
  newTag: {
    background: "#fff",
    borderStyle: "dashed",
  },
};
```

**(c) Update destructure on line 95.** Before:
```js
const { classes, label, removeAll } = this.props;
```
After:
```js
const { label, removeAll } = this.props;
```

**(d) Update className on line 142.** `classes.newTag` → `styles.newTag`.

**(e) Update export on line 158.**
```js
// Before:
export default injectSheet(styles)(TagControl);
// After:
export default TagControl;
```

- [ ] **Step 3: Verify in dev server**

`http://localhost:3000/dataset/3/about` — find a field that uses TagControl (keywords, alternative codes, etc.). Look for a small Tag chip with a dashed border and a `+` icon (the "add" affordance). It should render with a white background and dashed grey border.

If you can't find one on a read-only page, edit the dataset metadata (requires login as editor) — most TagControl uses are inside the metadata edit form.

- [ ] **Step 4: Commit**

```bash
git add src/components/newTag.module.css src/components/TagControl.js
git commit -m "$(cat <<'EOF'
Convert TagControl to CSS Modules + add shared newTag.module.css

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Convert `CitationControl` (consumes `newTagTall`)

**Files:**
- Modify: `src/components/MetaData/CitationControl.js`

- [ ] **Step 1: Edit `CitationControl.js`**

**(a) Replace JSS import (line 5):**
```js
// Before:
import injectSheet from "react-jss";
// After:
import styles from "../newTag.module.css";
```

**(b) Delete the JS `styles` constant — lines 19–25:**

```js
const styles = {
  newTag: {
    background: "#fff",
    borderStyle: "dashed",
    maxHeight: "22px",
  },
};
```

**(c) Update destructure on line 123.** Before:
```js
const {
  classes,
  label,
  removeAll,
  agentType = "contact",
  array = true,
} = this.props;
```
After:
```js
const {
  label,
  removeAll,
  agentType = "contact",
  array = true,
} = this.props;
```

**(d) Update className on line 195.** `classes.newTag` → `styles.newTagTall` (note the rename — this file used the `max-height: 22px` variant, which lives under the `newTagTall` class in the shared module).

**(e) Update export on line 242.**
```js
// Before:
export default injectSheet(styles)(CitationControl);
// After:
export default CitationControl;
```

- [ ] **Step 2: Verify in dev server**

`http://localhost:3000/dataset/3/about` — find the "Source citation" / "Citations" section. The "add new citation" tag (white, dashed border, `+` icon, max 22px tall) renders correctly. Click it; the modal opens (unrelated to this change but confirms nothing else broke).

- [ ] **Step 3: Commit**

```bash
git add src/components/MetaData/CitationControl.js
git commit -m "$(cat <<'EOF'
Convert CitationControl to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Convert `AgentControl` (consumes `newTagTall`)

**Files:**
- Modify: `src/components/MetaData/AgentControl.js`

- [ ] **Step 1: Edit `AgentControl.js`**

**(a) Replace JSS import (line 5):**
```js
// Before:
import injectSheet from "react-jss";
// After:
import styles from "../newTag.module.css";
```

**(b) Delete the JS `styles` constant — lines 22–28:**

```js
const styles = {
  newTag: {
    background: "#fff",
    borderStyle: "dashed",
    maxHeight: "22px",
  },
};
```

**(c) Update destructure on line 125.** Before:
```js
const {
  classes,
  label,
  removeAll,
  agentType = "contact",
  array = true,
} = this.props;
```
After:
```js
const {
  label,
  removeAll,
  agentType = "contact",
  array = true,
} = this.props;
```

**(d) Update className on line 192.** `classes.newTag` → `styles.newTagTall`.

**(e) Update export on line 241.**
```js
// Before:
export default injectSheet(styles)(AgentControl);
// After:
export default AgentControl;
```

- [ ] **Step 2: Verify in dev server**

`http://localhost:3000/dataset/3/about` — find a "Contact" / "Creators" / "Editors" field (anywhere AgentControl is used). The "add new agent" tag (white, dashed border, `+` icon, max 22px tall) renders correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/MetaData/AgentControl.js
git commit -m "$(cat <<'EOF'
Convert AgentControl to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Convert `KeyValueControl` (consumes `newTag`)

**Files:**
- Modify: `src/components/MetaData/KeyValueControl.js`

- [ ] **Step 1: Edit `KeyValueControl.js`**

**(a) Replace JSS import (line 5):**
```js
// Before:
import injectSheet from "react-jss";
// After:
import styles from "../newTag.module.css";
```

**(b) Delete the JS `styles` constant — lines 18–23:**

```js
const styles = {
  newTag: {
    background: "#fff",
    borderStyle: "dashed",
  },
};
```

**(c) Update destructure on line 97.** Before:
```js
const { classes, label, removeAll } = this.props;
```
After:
```js
const { label, removeAll } = this.props;
```

**(d) Update className on line 146.** `classes.newTag` → `styles.newTag`.

**(e) Update export on line 162.**
```js
// Before:
export default injectSheet(styles)(KeyValueControl);
// After:
export default KeyValueControl;
```

- [ ] **Step 2: Verify in dev server**

`http://localhost:3000/dataset/3/about` — find a section that uses key-value pairs (e.g., "Identifier", or any other key/value form). The "+" add tag renders white/dashed.

- [ ] **Step 3: Commit**

```bash
git add src/components/MetaData/KeyValueControl.js
git commit -m "$(cat <<'EOF'
Convert KeyValueControl to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Introduce shared `borderedListItem.module.css` and convert `BorderedListItem`

This task creates the shared "bordered list item" module that Task 10 (`PresentationItem`) also consumes.

**Files:**
- Create: `src/components/borderedListItem.module.css`
- Create: `src/pages/Taxon/BorderedListItem.module.css`
- Modify: `src/pages/Taxon/BorderedListItem.js`

- [ ] **Step 1: Create the shared CSS module**

`src/components/borderedListItem.module.css`:

```css
.formItem {
  padding-bottom: 0;
  width: 100%;
  clear: both;
  border-bottom: 1px solid #eee;
}
.formItem:last-of-type {
  border: none;
}

.label {
  display: block;
  color: rgba(0, 0, 0, 0.85);
}

.content {
  word-break: break-word;
  margin-bottom: 0;
}

.noContent {
  word-break: break-word;
  color: #bbb;
  margin-bottom: 0;
}

.contentCol {
  word-break: break-word;
}

.smallMargin {
  margin-bottom: 3px;
  margin-top: 3px;
}

.mediumMargin {
  margin-bottom: 10px;
  margin-top: 10px;
}
```

- [ ] **Step 2: Create the local consumer module**

`src/pages/Taxon/BorderedListItem.module.css`:

```css
.formItem    { composes: formItem    from "../../components/borderedListItem.module.css"; }
.label       { composes: label       from "../../components/borderedListItem.module.css"; }
.content     { composes: content     from "../../components/borderedListItem.module.css"; }
.noContent   { composes: noContent   from "../../components/borderedListItem.module.css"; }
.contentCol  { composes: contentCol  from "../../components/borderedListItem.module.css"; }
.smallMargin { composes: smallMargin from "../../components/borderedListItem.module.css"; }
.mediumMargin{ composes: mediumMargin from "../../components/borderedListItem.module.css"; }
```

Why re-export rather than import the shared module directly: it keeps the consumer JS local and idiomatic (`styles.formItem` resolves via the local module). It also leaves room to add page-specific rules later without disturbing the shared file.

- [ ] **Step 3: Rewrite `BorderedListItem.js`**

Replace the entire file with:

```js
import React from "react";
import { Row, Col } from "antd";

// Wrappers
import withWidth from "../../components/hoc/Width";
import styles from "./BorderedListItem.module.css";

/**
 * Component responsible for data display in a read mode
 * @param size - how dense should the layout be. options: 'small', 'medium' (default).
 * @param children - wrapped content
 * @param width - passed from withWidth wrapper, data about current page size
 * @returns {*}
 * @constructor
 */
const BorderedListItem = ({ children, size }) => {
  const getValue = () => {
    let value = (
      <span className={styles.noContent}>No information</span>
    );

    if (Array.isArray(children) && children.length > 0) {
      value = children.map((item, i) => (
        <span className={styles.content} key={i}>
          {item}
        </span>
      ));
    } else if (!Array.isArray(children) && typeof children !== "undefined") {
      value = <span className={styles.content}>{children}</span>;
    }

    return value;
  };

  const marginSize =
    size === "medium" ? styles.mediumMargin : styles.smallMargin;
  return (
    <Row className={styles.formItem}>
      <Col span={24} className={marginSize}>
        {getValue()}
      </Col>
    </Row>
  );
};

export default withWidth()(BorderedListItem);
```

Notes:
- Removed JSS import and the `styles = () => ({...})` constant.
- Removed `classes` from destructure.
- All `classes.x` → `styles.x`.
- Dropped the now-stale JSDoc line about `classes` being passed from injectSheet.
- `width` was destructured in the type-doc but never used in the body; left alone (matches current behaviour).

- [ ] **Step 4: Verify in dev server**

`http://localhost:3000/dataset/3/taxon/<any-taxon-id>` — pick any taxon page. The detail rows (synonyms, references, vernacular names, etc.) render with the same bordered-list look: thin `1px solid #eee` separator under each row, no border on the last row.

- [ ] **Step 5: Commit**

```bash
git add src/components/borderedListItem.module.css src/pages/Taxon/BorderedListItem.module.css src/pages/Taxon/BorderedListItem.js
git commit -m "$(cat <<'EOF'
Convert BorderedListItem to CSS Modules + add shared borderedListItem.module.css

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Convert `PresentationItem` (composes shared rules + adds extras)

**Files:**
- Create: `src/components/PresentationItem.module.css`
- Modify: `src/components/PresentationItem.js`

- [ ] **Step 1: Create the CSS module**

`src/components/PresentationItem.module.css`:

```css
.formItem    { composes: formItem    from "./borderedListItem.module.css"; }
.formItem > div { padding-left: 10px; padding-right: 10px; }

.label {
  composes: label from "./borderedListItem.module.css";
  overflow: hidden;
  text-overflow: ellipsis;
}

.content     { composes: content     from "./borderedListItem.module.css"; }
.noContent   { composes: noContent   from "./borderedListItem.module.css"; }
.contentCol  { composes: contentCol  from "./borderedListItem.module.css"; }
.smallMargin { composes: smallMargin from "./borderedListItem.module.css"; }
.mediumMargin{ composes: mediumMargin from "./borderedListItem.module.css"; }
```

The shared `.formItem` carries the original rules and the `:last-of-type` reset. The local `.formItem > div` adds PresentationItem's child padding. CSS Modules' `composes:` keyword is the mechanism that wires both class names together at build time.

- [ ] **Step 2: Rewrite `PresentationItem.js`**

Replace the entire file with:

```js
import React, {useRef, useState, useEffect} from "react";
import { Row, Col } from "antd";

import Help from "./Help";
import styles from "./PresentationItem.module.css";

// Wrappers
import withWidth, { MEDIUM } from "./hoc/Width";

function isOverflowing(el)
{
   var curOverflow = el.style.overflow;

   if ( !curOverflow || curOverflow === "visible" )
      el.style.overflow = "hidden";

   var isOverflowing = el.clientWidth < el.scrollWidth;

   el.style.overflow = curOverflow;

   return isOverflowing;
}

/**
 * Component responsible for data display in a read mode
 * @param label - label text
 * @param helpText - text to be displayed as a tip
 * @param md - Label column width on medium devices - seconds column is the reamining.
 * @param size - how dense should the layout be. options: 'small', 'medium' (default).
 * @param children - wrapped content
 * @param width - passed from withWidth wrapper, data about current page size
 * @returns {*}
 * @constructor
 */
const PresentationItem = ({
  label,
  helpText,
  children,
  width,
  md,
  size,
}) => {

  const labelRef = useRef();
  const [overflowHelp, setOverFlowHelp] = useState(null);
  const [formattedLabel, setFormattedLabel] = useState(label)
  useEffect(()=> {

    let overflow = labelRef.current && isOverflowing(labelRef.current);
    if(!overflow){
      setFormattedLabel(label)
    } else if(typeof label === 'string' && (label.startsWith('http://') || label.startsWith('https://'))) {
      setOverFlowHelp(label);
      const splitted = label.replace(/^https?:\/\//, '').split("/");
      setFormattedLabel(`${splitted[0]}...${splitted[splitted.length-1]}`)
    } else {
      setOverFlowHelp(label)
      setFormattedLabel(label)
    }

  }, [label, labelRef.current])

  const getValue = () => {
    let value = <dd className={styles.noContent}>No information</dd>;

    if (Array.isArray(children) && children.length > 0) {
      value = children.map((item, i) => (
        <dd className={styles.content} key={i}>
          {item}
        </dd>
      ));
    } else if (!Array.isArray(children) && typeof children !== "undefined") {
      value = <dd className={styles.content}>{children}</dd>;
    }

    return value;
  };

  const medium = md || 8;
  const mediumCol2 = medium < 24 ? 24 - medium : 24;
  const marginSize =
    size === "medium" ? styles.mediumMargin : styles.smallMargin;
  return (
    <Row className={styles.formItem}>
      <Col
        sm={24}
        md={medium}
        style={width < MEDIUM ? { marginBottom: 0 } : {}}
        className={marginSize}
      >
        <div>
          <dt className={styles.label} ref={labelRef} >
            {formattedLabel}
            <Help title={helpText || overflowHelp} />
          </dt>
        </div>
      </Col>
      <Col
        sm={24}
        md={mediumCol2}
        style={width < MEDIUM ? { marginTop: 0 } : {}}
        className={marginSize}
      >
        {getValue()}
      </Col>
    </Row>
  );
};

export default withWidth()(PresentationItem);
```

- [ ] **Step 3: Verify in dev server**

`http://localhost:3000/dataset/3/about` — this page is dense with `PresentationItem` rows. Confirm:
- Each row has the `1px solid #eee` bottom border (except the last).
- The two inner columns have horizontal padding (10px left/right) — the label/value text doesn't sit flush against the row edges.
- A long URL label is truncated with an ellipsis and shows a help tooltip when hovered (this exercises the `overflow: hidden; text-overflow: ellipsis` on `.label`).

- [ ] **Step 4: Commit**

```bash
git add src/components/PresentationItem.module.css src/components/PresentationItem.js
git commit -m "$(cat <<'EOF'
Convert PresentationItem to CSS Modules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Unwrap `BasicMenu` (no styles to migrate)

`BasicMenu.js` declares `const styles = {};` — the JSS wrapper exists but injects no rules. This task removes the wrapper entirely.

**Files:**
- Modify: `src/components/LayoutNew/BasicMenu.js`

- [ ] **Step 1: Edit `BasicMenu.js`**

**(a) Remove the JSS import — line 4:**
```js
// Delete this line:
import injectSheet from "react-jss";
```

**(b) Remove the empty `styles` constant — line 93:**
```js
// Delete this line:
const styles = {};
```

**(c) Update the export — lines 1167–1169.** Before:

```js
export default withRouter(
  injectSheet(styles)(withContext(mapContextToProps)(BasicMenu))
);
```

After:

```js
export default withRouter(
  withContext(mapContextToProps)(BasicMenu)
);
```

- [ ] **Step 2: Verify in dev server**

Visit `http://localhost:3000/` and click around the left-hand main navigation menu. Every menu item, submenu expand/collapse, and active-highlight behaviour should be identical (BasicMenu's appearance is driven by antd and `./menu.css`, not by JSS).

- [ ] **Step 3: Commit**

```bash
git add src/components/LayoutNew/BasicMenu.js
git commit -m "$(cat <<'EOF'
Unwrap BasicMenu from injectSheet (styles object was empty)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Drop `<ThemeProvider>` and dead `theme` constant from `App.js`

No file reads the JSS theme. The same `colorPrimary` is already passed to antd's `ConfigProvider` (which is what actually drives the palette). This task removes the dead wiring.

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Edit `src/App.js`**

**(a) Remove the JSS import — line 20:**
```js
// Delete this line:
import { ThemeProvider } from "react-jss";
```

**(b) Replace the `theme` / `antdTheme` block — lines 84–91.** Before:

```js
const theme = {
  colorPrimary: "deepskyblue",
};

// antd 5+ defaults to a different blue than v4. Pin colorPrimary so the
// jss-styled components (which use the same `theme` object) and antd
// components stay visually consistent.
const antdTheme = { token: { colorPrimary: theme.colorPrimary } };
```

After:

```js
// antd 5+ defaults to a different blue than v4. Pin colorPrimary so the brand
// blue (deepskyblue) survives the antd version bump.
const antdTheme = { token: { colorPrimary: "deepskyblue" } };
```

**(c) Remove the `<ThemeProvider>` wrapper.** In the JSX (around lines 157 and 429), the structure is:

```jsx
<BrowserRouter>
  <NavigatorInstaller />
  <ThemeProvider theme={theme}>
    <Routes>
      ...
    </Routes>
  </ThemeProvider>
  <ProviderRoutes />
</BrowserRouter>
```

Change to:

```jsx
<BrowserRouter>
  <NavigatorInstaller />
  <Routes>
    ...
  </Routes>
  <ProviderRoutes />
</BrowserRouter>
```

I.e., delete the two `<ThemeProvider theme={theme}>` and `</ThemeProvider>` lines and outdent the `<Routes>...</Routes>` block by two spaces.

- [ ] **Step 2: Verify in dev server**

`http://localhost:3000/` — the entire app should still load and render with the deepskyblue primary colour (links, primary buttons, active menu items). Check a couple of pages for any visual change.

- [ ] **Step 3: Commit**

```bash
git add src/App.js
git commit -m "$(cat <<'EOF'
Drop dead JSS ThemeProvider from App.js

No component reads the JSS theme; antd's ConfigProvider already carries
the same colorPrimary value, which is what actually drives the palette.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Uninstall `react-jss`

The package is now unused. Drop the dependency and the bundle weight.

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Confirm zero remaining `react-jss` references**

Run:
```bash
grep -rn "react-jss\|injectSheet" src/
```

Expected: no output.

If anything matches, **stop and investigate** — a conversion was missed.

- [ ] **Step 2: Uninstall the package**

```bash
npm uninstall react-jss
```

Expected: removes ~1 package from `node_modules` and edits both `package.json` (drops the line `"react-jss": "^10.10.0",`) and `package-lock.json`.

- [ ] **Step 3: Verify build still succeeds**

```bash
npm run build
```

Expected: build completes without errors. (The `gitTag.cjs` and `writeEnums.cjs` prebuild steps need network access to the API — if they fail because you're offline, that's pre-existing, not caused by this change.)

If you're offline and the prebuild fails, fall back to running just `vite build` directly:
```bash
npx vite build
```

- [ ] **Step 4: Final dev-server smoke test**

Restart `npm start` (so Vite re-resolves dependencies cleanly), then revisit:
- `/` — chrome, sider, user menu render.
- `/dataset/3/about` — Help icons, group headers, presentation rows, tag controls all render.
- `/dataset/3/taxon/<any-id>` — bordered list items render.

No console errors, no missing styles, no white screen.

- [ ] **Step 5: Update `TODO.md`**

Open `TODO.md` and remove the "Drop `react-jss` in favour of antd's CSS-in-JS" bullet from the "Stack modernization follow-ups" section, since it's now done.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json TODO.md
git commit -m "$(cat <<'EOF'
Uninstall react-jss

All injectSheet call sites migrated to CSS Modules. ThemeProvider was
already removed; nothing imports from react-jss any more.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification checklist

After Task 13's commit, run through this once before opening a PR:

- [ ] `grep -rn "react-jss\|injectSheet" src/` returns empty.
- [ ] `grep -n "react-jss" package.json` returns empty.
- [ ] `npm run build` succeeds.
- [ ] Dev server: `/`, `/dataset/3/about`, `/dataset/3/taxon/<id>` all render with no console errors and no visual drift versus `master`.
- [ ] Bundle size: should be ~80 KB smaller (`react-jss` was a runtime dep). Optional check:
  ```bash
  du -sh build/static/js/*.js | sort -h | tail
  ```
  Compare against a `master` build if you saved one.
