const domPolyfill = (function () {
  if (Object.defineProperty && Object.getOwnPropertyDescriptor &&
    Object.getOwnPropertyDescriptor(Element.prototype, "textContent") &&
    !Object.getOwnPropertyDescriptor(Element.prototype, "textContent").get) {
    (function () {
      var innerText = Object.getOwnPropertyDescriptor(Element.prototype, "innerText");
      Object.defineProperty(Element.prototype, "textContent",
        { // It won't work if you just drop in innerText.get
          // and innerText.set or the whole descriptor.
          get: function () {
            return innerText.get.call(this)
          },
          set: function (x) {
            return innerText.set.call(this, x)
          }
        }
      );
    })();
  }

  // EventListener | CC0 | github.com/jonathantneal/EventListener
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

  // Source: https://gist.github.com/k-gun/c2ea7c49edf7b757fe9561ba37cb19ca
  ; (function () {
    // helpers
    var regExp = function (name) {
      return new RegExp('(^| )' + name + '( |$)');
    };
    var forEach = function (list, fn, scope) {
      for (var i = 0; i < list.length; i++) {
        fn.call(scope, list[i]);
      }
    };

    // class list object with basic methods
    function ClassList(element) {
      this.element = element;
    }

    ClassList.prototype = {
      add: function () {
        forEach(arguments, function (name) {
          if (!this.contains(name)) {
            this.element.className += ' ' + name;
          }
        }, this);
      },
      remove: function () {
        forEach(arguments, function (name) {
          this.element.className =
            this.element.className.replace(regExp(name), ' ');
        }, this);
      },
      toggle: function (name) {
        return this.contains(name)
          ? (this.remove(name), false) : (this.add(name), true);
      },
      contains: function (name) {
        return regExp(name).test(this.element.className);
      },
      // bonus..
      replace: function (oldName, newName) {
        this.remove(oldName), this.add(newName);
      }
    };

    // IE8/9, Safari
    if (!('classList' in Element.prototype)) {
      Object.defineProperty(Element.prototype, 'classList', {
        get: function () {
          return new ClassList(this);
        }
      });
    }

    // replace() support for others
    if (window.DOMTokenList && DOMTokenList.prototype.replace == null) {
      DOMTokenList.prototype.replace = ClassList.prototype.replace;
    }
  })();



  if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest =
      function (s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
          i,
          el = this;
        do {
          i = matches.length;
          while (--i >= 0 && matches.item(i) !== el) { };
        } while ((i < 0) && (el = el.parentElement));
        return el;
      };
  }

  !('getComputedStyle' in window) && (window.getComputedStyle = (function () {
    function getPixelSize(element, style, property, fontSize) {
      var
        sizeWithSuffix = style[property],
        size = parseFloat(sizeWithSuffix),
        suffix = sizeWithSuffix.split(/\d/)[0],
        rootSize;

      fontSize = fontSize != null ? fontSize : /%|em/.test(suffix) && element.parentElement ? getPixelSize(element.parentElement, element.parentElement.currentStyle, 'fontSize', null) : 16;
      rootSize = property == 'fontSize' ? fontSize : /width/i.test(property) ? element.clientWidth : element.clientHeight;

      return (suffix == 'em') ? size * fontSize : (suffix == 'in') ? size * 96 : (suffix == 'pt') ? size * 96 / 72 : (suffix == '%') ? size / 100 * rootSize : size;
    }

    function setShortStyleProperty(style, property) {
      var
        borderSuffix = property == 'border' ? 'Width' : '',
        t = property + 'Top' + borderSuffix,
        r = property + 'Right' + borderSuffix,
        b = property + 'Bottom' + borderSuffix,
        l = property + 'Left' + borderSuffix;

      style[property] = (style[t] == style[r] == style[b] == style[l] ? [style[t]]
        : style[t] == style[b] && style[l] == style[r] ? [style[t], style[r]]
          : style[l] == style[r] ? [style[t], style[r], style[b]]
            : [style[t], style[r], style[b], style[l]]).join(' ');
    }

    function CSSStyleDeclaration(element) {
      var
        currentStyle = element.currentStyle,
        style = this,
        fontSize = getPixelSize(element, currentStyle, 'fontSize', null);

      for (property in currentStyle) {
        if (/width|height|margin.|padding.|border.+W/.test(property) && style[property] !== 'auto') {
          style[property] = getPixelSize(element, currentStyle, property, fontSize) + 'px';
        } else if (property === 'styleFloat') {
          style['float'] = currentStyle[property];
        } else {
          style[property] = currentStyle[property];
        }
      }

      setShortStyleProperty(style, 'margin');
      setShortStyleProperty(style, 'padding');
      setShortStyleProperty(style, 'border');

      style.fontSize = fontSize + 'px';

      return style;
    }

    CSSStyleDeclaration.prototype = {
      constructor: CSSStyleDeclaration,
      getPropertyPriority: function () { },
      getPropertyValue: function (prop) {
        return this[prop] || '';
      },
      item: function () { },
      removeProperty: function () { },
      setProperty: function () { },
      getPropertyCSSValue: function () { }
    };

    function getComputedStyle(element) {
      return new CSSStyleDeclaration(element);
    }

    return getComputedStyle;
  })());


}());

export default domPolyfill;