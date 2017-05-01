////////////////////////////////////////////////////////////////////////////////////////////////////

// CustomEvent
Object.defineProperty(Window.prototype, "CustomEvent", {
  get: function () {
    var self = this;

    return function CustomEvent(type, eventInitDict) {
      var event = self.document.createEventObject(), key;

      event.type = type;
      for (key in eventInitDict) {
        if (key == 'cancelable') {
          event.returnValue = !eventInitDict.cancelable;
        } else if (key == 'bubbles') {
          event.cancelBubble = !eventInitDict.bubbles;
        } else if (key == 'detail') {
          event.detail = eventInitDict.detail;
        }
      }
      return event;
    };
  }
});
(!window.CustomEvent || typeof window.CustomEvent === "object") && (function () {
  // CustomEvent for browsers which don't natively support the Constructor method
  window.CustomEvent = function CustomEvent(type, eventInitDict) {
    var event;
    eventInitDict = eventInitDict || { bubbles: false, cancelable: false, detail: undefined };

    try {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(type, eventInitDict.bubbles, eventInitDict.cancelable, eventInitDict.detail);
    } catch (error) {
      // for browsers which don't support CustomEvent at all, we use a regular event instead
      event = document.createEvent('Event');
      event.initEvent(type, eventInitDict.bubbles, eventInitDict.cancelable);
      event.detail = eventInitDict.detail;
    }

    return event;
  };
})();

if (!document.elementsFromPoint && document.elementFromPoint) {
  document.elementsFromPoint = function (x, y) {
    var els = [], el, visibility = [], i;
    while (el !== document.documentElement) {
      el = document.elementFromPoint(x, y);
      els.push(el);
      visibility.push(el.style.visibility)
      el.style.visibility = "hidden";
    }

    for (i = 0; i < els.length; i++) {
      els[i].style.visibility = visibility[i];
    }

    return els;
  }
}

export default {};