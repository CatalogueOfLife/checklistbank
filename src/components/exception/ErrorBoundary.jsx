import React from "react";
import { Button, Result } from "antd";
import newGithubIssueUrl from "new-github-issue-url";

// When a render throws and nothing catches it, React unmounts the whole tree,
// which previously turned any unexpected error into a blank white page
// (issue #1667 — a transient 404 left the taxon page completely blank). This
// boundary catches those errors and shows a recoverable message instead.
//
// It resets automatically when `resetKey` changes — App passes the current
// pathname, so navigating to another page clears a stuck error without a
// full reload.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    // A changed resetKey means we navigated to a different page; drop any
    // error captured on the previous one so the new page can render.
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    // Keep the full stack in the console for debugging; the UI only summarises.
    console.error("Uncaught error while rendering page:", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <Result
        status="error"
        title="Something went wrong"
        subTitle={
          error?.message ||
          "An unexpected error occurred while rendering this page."
        }
        extra={[
          <Button
            type="primary"
            key="reload"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>,
          <Button
            key="report"
            target="_blank"
            href={newGithubIssueUrl({
              user: "CatalogueOfLife",
              repo: "checklistbank",
              title: `Bug: ${error?.message || "Unexpected UI error"}`,
              body: `**URL:** ${window.location.href}\n\n\`\`\`\n${
                error?.stack || error
              }\n\`\`\``,
            })}
          >
            Report issue
          </Button>,
        ]}
      />
    );
  }
}

export default ErrorBoundary;
