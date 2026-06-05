// Guard against the React + page-translation crash (facebook/react#11538).
//
// Browser translation (Google Translate, Chrome's built-in translate, and
// similar extensions) rewrites the DOM by wrapping each text node in a <font>
// element, which detaches the original text node from the parent React still
// holds a reference to. When React later removes or repositions that node it
// calls parent.removeChild() / parent.insertBefore() on a node that is no
// longer a child, throwing "NotFoundError: ... is not a child of this node"
// and blanking the page (issue #1669 — the dataset download page, which
// toggles conditional text nodes, was a frequent trigger).
//
// Making these two operations no-op when the node's parent has changed lets
// React's reconciliation continue harmlessly: valid calls are untouched (the
// guard only fires in exactly the case that would otherwise throw), and the
// translated DOM simply stays as the translator left it.

let installed = false;

export default function installTranslationCrashGuard() {
  if (installed) return;
  if (typeof Node !== "function" || !Node.prototype) return;
  installed = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}
