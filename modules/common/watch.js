function watch(scope, eventType, selector, callback, shouldManualBubble = true) {
  const handler = e => {
    if (e.target.matches(selector)) {
      callback(e, e.target);
    } else if (shouldManualBubble) {
      let closest = e.target.closest(selector)
      if (closest) {
        callback(e, closest)
      }
    }
  };
  scope.addEventListener(eventType, handler);
  return () => {
    scope.removeEventListener(eventType, handler);
  }
}

//https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function (s) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(s),
        i = matches.length;
      while (--i >= 0 && matches.item(i) !== this) { }
      return i > -1;
    };
}

if (window.Element && !Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el;
    for (el = this; el && el.matches && !el.matches(s); el = el.parentNode) { }
    return el && el.nodeType !== 1 ? null : el;
  }
}

export default watch;