const htmlTrim = function () {
  return function (html) {
    let div = document.createElement("div");
    div.innerHTML = html;
    let node = div,
      nodes = [],
      i = 0;
    while (node !== null) {
      if (node != null) {
        if (node.nodeType === 3 && node.nodeValue.match(/^[ \t\n\r]+$/g)) {
          // &nbsp; will survive
          nodes.push(node);
        }
        if (node.hasChildNodes()) {
          node = node.firstChild;
        } else {
          while (node.nextSibling === null && node !== div) {
            node = node && node.parentNode;
          }
          node = node && node.nextSibling;
        }
      }
    }
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i].parentNode) {
        nodes[i].parentNode.removeChild(nodes[i]);
      }
    }
    return div.innerHTML;
  };
}();

export default htmlTrim;