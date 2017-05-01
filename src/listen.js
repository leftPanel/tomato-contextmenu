function listen(node, eventType, listener) {
  if (window.jQuery) {
    let $node = $(node);
    $node.on(eventType, listener);
    return function () {
      $node.off(eventType, listener);
      $node = null;
      node = null;
    };
  }

  if (document.addEventListener) {
    let shouldCapture = eventType === "focus";
    node.addEventListener(eventType, listener, shouldCapture);
    return function () {
      node.removeEventListener(eventType, listener, shouldCapture);
      node = null;
    };
  }

  if (document.attachEvent) {
    var fn = compatible(listener, node);
    node.attachEvent(`on${eventType}`, fn);
    return function () {
      node.detachEvent(`on${eventType}`, fn);
      node = null;
    }
  }
}

function compatible(fn, node) {
  return function (e) {
    e = e || window.event;

    e.target = e.target || e.srcElement || node;

    e.preventDefault = function () {
      e.returnValue = false;
    };

    e.stopPropagation = function () {
      e.cancelBubble = true;
    };

    e.which = e.keyCode
      ? e.keyCode
      : isNaN(e.button)
        ? undefined
        : e.button + 1;

    e.relatedTarget = e.type === "mouseover"
      ? e.fromElement
      : e.type === "mouseout"
        ? e.toElement
        : null;

    return fn(e);
  }
}

export default listen;