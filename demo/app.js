var tomatoContextmenu = (function() {
        "use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tomatoContextmenu = function () {

  //module X:\tomato-contextmenu\src\listen.js start: 


  var listen = function () {
    function listen(node, eventType, listener) {
      if (window.jQuery) {
        var $node = $(node);
        $node.on(eventType, listener);
        return function () {
          $node.off(eventType, listener);
          $node = null;
          node = null;
        };
      }

      if (document.addEventListener) {
        var shouldCapture = eventType === "focus";
        node.addEventListener(eventType, listener, shouldCapture);
        return function () {
          node.removeEventListener(eventType, listener, shouldCapture);
          node = null;
        };
      }

      if (document.attachEvent) {
        var fn = compatible(listener, node);
        node.attachEvent("on" + eventType, fn);
        return function () {
          node.detachEvent("on" + eventType, fn);
          node = null;
        };
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

        e.which = e.keyCode ? e.keyCode : isNaN(e.button) ? undefined : e.button + 1;

        e.relatedTarget = e.type === "mouseover" ? e.fromElement : e.type === "mouseout" ? e.toElement : null;

        return fn(e);
      };
    }

    return listen;
  }();

  //module X:\tomato-contextmenu\src\listen.js end

  //module X:\tomato-contextmenu\src\tomato.js start: 


  var tomato = function () {
    var Tomato = function () {
      function Tomato() {
        _classCallCheck(this, Tomato);
      }

      Tomato.prototype.map = function map(list, fn) {
        var l, i, res;
        for (l = list.length, i = 0, res = []; i < l; i++) {
          res.push(fn(list[i], i, list));
        }

        return res;
      };

      Tomato.prototype.each = function each(list, fn) {
        var l,
            i,
            li = list;
        for (l = li.length, i = 0; i < l; i++) {
          fn(li[i], i, li);
        }
      };

      Tomato.prototype.consume = function consume(list, fn) {
        while (list.length) {
          fn(list.shift());
        }
      };

      Tomato.prototype.findRight = function findRight(list, fn) {
        var i = void 0;
        for (i = list.length - 1; i >= 0; i--) {
          if (fn(list[i], i, list)) {
            return list[i];
          }
        }
        return null;
      };

      Tomato.prototype.closest = function closest(el, sel) {
        if (el.closest) {
          return el.closest(sel);
        }
        var e = void 0;
        for (e = el; e; e = e.parentNode) {
          if (this.matches(e, sel)) {
            return e;
          }
        }
        return null;
      };

      Tomato.prototype.matches = function matches(el, sel) {
        var useRaw = void 0,
            res = void 0;
        this.each(["matches", "matchesSelector", "msMatchesSelector", "oMatchesSelector", "webkitMatchesSelector"], function (fn) {
          if (el[fn]) {
            useRaw = true;
            res = el[fn](sel);
          }
        });

        if (useRaw) {
          return res;
        }

        var els = (el.parentNode || el.ownerDocument || document).querySelectorAll(sel),
            i = els.length;
        while (--i >= 0 && els.item(i) !== el) {}
        return i > -1;
      };

      Tomato.prototype.prev = function prev(el, sel) {
        var e = void 0;
        for (e = el.previousSibling; e; e = e.previousSibling) {
          if (e.nodeType === 1 && sel(e)) {
            return e;
          }
        }
        return null;
      };

      Tomato.prototype.next = function next(el, sel) {
        var e = void 0;
        for (e = el.nextSibling; e; e = e.nextSibling) {
          if (e.nodeType === 1 && sel(e)) {
            return e;
          }
        }
        return null;
      };

      Tomato.prototype.lastChild = function lastChild(el, sel) {
        var e = void 0;

        for (e = el.lastChild; e; e = e.previousSibling) {
          if (e.nodeType === 1 && sel(e)) {
            return e;
          }
        }
        return null;
      };

      Tomato.prototype.firstChild = function firstChild(el, sel) {
        var e = void 0;

        for (e = el.firstChild; e; e = e.nextSibling) {
          if (e.nodeType === 1 && sel(e)) {
            return e;
          }
        }
        return null;
      };

      return Tomato;
    }();

    var tomato = new Tomato();

    return tomato;
  }();

  //module X:\tomato-contextmenu\src\tomato.js end

  //module X:\tomato-contextmenu\src\getDomNodefromHtml.js start: 


  var getDomNodefromHtml = function () {
    function getDomNodefromHtml(html) {
      var div = document.createElement('div'),
          i;
      div.innerHTML = html;

      for (i = 0; i < div.childNodes.length; i++) {
        if (div.childNodes[i].nodeType === 1) {
          return div.childNodes[i];
        }
      }
      return null;
    }

    return getDomNodefromHtml;
  }();

  //module X:\tomato-contextmenu\src\getDomNodefromHtml.js end

  //module X:\tomato-contextmenu\src\getMenuPosition.js start: 


  var getMenuPosition = function () {
    function getMenuPosition(menu, x, y) {
      var menuStyles = {
        top: y,
        left: x
      },
          bottom = document.documentElement.clientHeight,
          right = document.documentElement.clientWidth,
          height = menu.clientHeight,
          width = menu.clientWidth;

      if (menuStyles.top + height > bottom) {
        menuStyles.top -= height;
      }

      if (menuStyles.top < 0) {
        menuStyles.top = 0;
      }

      if (menuStyles.left + width > right) {
        menuStyles.left -= width;
      }

      if (menuStyles.left < 0) {
        menuStyles.left = 0;
      }

      return menuStyles;
    }

    return getMenuPosition;
  }();

  //module X:\tomato-contextmenu\src\getMenuPosition.js end

  //module X:\tomato-contextmenu\src\getClosestLiElement.js start: 


  var getClosestLiElement = function () {
    function getClosestLiElement(el) {
      if (el.closest) {
        return el.closest("li");
      }
      var e = null;
      for (e = el; e; e = e.parentNode) {
        if (e.tagName && e.tagName.toUpperCase() === "LI") {
          return e;
        }
      }
      return null;
    }

    return getClosestLiElement;
  }();

  //module X:\tomato-contextmenu\src\getClosestLiElement.js end

  //module X:\tomato-contextmenu\src\menuItemParser.js start: 


  var menuItemParser = function () {

    var menuItemParser = function menuItemParser(_ref) {
      var kind = _ref.kind,
          text = _ref.text,
          disabled = _ref.disabled,
          active = _ref.active,
          callbackId = _ref.callbackId,
          children = _ref.children;

      var dataHasChildren = children ? "data-has-children" : "";
      switch (kind) {
        case "separator":
          return "<li class=\"divider\" style=\"margin:3px 0;\"></li>";
        default:
          return "<li tabindex=\"0\" class=\"" + (disabled && "disabled") + " " + (active && "active") + "\" data-callback-id=\"" + callbackId + "\" style=\"position:relative;\" " + dataHasChildren + ">\n        <a tabindex=\"-1\" href=\"javascript:void(0);\" style=\"outline:0;\">" + text + "</a>\n        " + (children ? "<span class=\"glyphicon glyphicon-menu-right\" style=\"position: absolute; top: 7px;right:2px;\"></span>" : "") + "\n        " + (children ? "<ul  class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"dropdownMenu\" style=\"position:absolute;left:auto;top:0;right:100%;display:none;margin:0;padding:3px 0;\">" + tomato.map(children, menuItemParser).join("") + "</ul>" : "") + "\n      </li>";
      }
    };

    return menuItemParser;
  }();

  //module X:\tomato-contextmenu\src\menuItemParser.js end

  //module X:\tomato-contextmenu\src\hasClass.js start: 


  var hasClass = function () {
    function hasClass(el, className) {
      if (el.nodeType !== 1) {
        return false;
      }

      if (el.classList) {
        return el.classList.contains(className);
      }

      var list = el.className.split(/\s+/),
          i = void 0;

      for (i = 0; i < list.length; i++) {
        if (list[i] === className) {
          return true;
        }
      }
      return false;
    }

    return hasClass;
  }();

  //module X:\tomato-contextmenu\src\hasClass.js end

  //module X:\tomato-contextmenu\src\addClass.js start: 


  var addClass = function () {
    function addClass(el, className) {
      if (el.nodeType === 1) {
        if (el.classList) {
          el.classList.add(className);
          return;
        }
        el.className += " " + className + " ";
      }
    }

    return addClass;
  }();

  //module X:\tomato-contextmenu\src\addClass.js end

  //module X:\tomato-contextmenu\src\removeClass.js start: 


  var removeClass = function () {
    function removeClass(el, className) {
      if (el.nodeType === 1) {

        if (el.classList) {
          el.classList.remove(className);
          return;
        }

        var list = el.className.split(/\s+/),
            i = void 0,
            nl = [];

        for (i = 0; i < list.length; i++) {
          if (list[i] !== className) {
            nl.push(list[i]);
          }
        }
        el.className = nl.join(" ");
      }
    }

    return removeClass;
  }();

  //module X:\tomato-contextmenu\src\removeClass.js end

  //module X:\tomato-contextmenu\src\Delay.js start: 


  var Delay = function () {
    var Delay = function () {
      function Delay(job, delay) {
        var _this = this;

        _classCallCheck(this, Delay);

        this.done = false;
        this.job = job;
        this.cancelHanler = setTimeout(function () {
          job();
          _this.done = true;
          _this.job = null;
        }, delay);
      }

      Delay.prototype.skip = function skip() {
        if (!this.done) {
          this.job();
        }
      };

      Delay.prototype.cancel = function cancel() {
        clearTimeout(this.cancelHanler);
      };

      return Delay;
    }();

    return Delay;
  }();

  //module X:\tomato-contextmenu\src\Delay.js end

  //module X:\tomato-contextmenu\src\setStyle.js start: 


  var setStyle = function () {
    function setStyle(el, style) {
      var text = el.style.cssText,
          rcss = parse(text),
          mcss = _extends({}, rcss, style);

      el.style.cssText = stringify(mcss);
    }

    function parse(text) {
      var css = {},
          list = text.split(/\s*;\s*/g),
          i = void 0;

      for (i = 0; i < list.length; i++) {
        var _list$i$split = list[i].split(/\s*:\s*/g),
            name = _list$i$split[0],
            value = _list$i$split[1];

        css[name] = value;
      }
      return css;
    }

    function stringify(css) {
      var text = "",
          name = void 0;
      for (name in css) {
        if (css.hasOwnProperty(name)) {
          text += name + ":" + css[name] + ";";
        }
      }
      return text;
    }

    return setStyle;
  }();

  //module X:\tomato-contextmenu\src\setStyle.js end

  return function () {

    var HOVER_CLASS_NAME = "hover";

    function tomatoContextmenu(_ref2) {
      var actions = _ref2.actions,
          x = _ref2.x,
          y = _ref2.y,
          callback = _ref2.callback;

      var list = tomato.map(actions, menuItemParser).join(""),
          menuHtml = "\n        <div class=\"dropdown clearfix context-menu\" style=\"position: fixed;top:0px;left:0px;z-index:99999;visibility:hidden;\">\n          <ul class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"dropdownMenu\" style=\"display:block;position:static;margin:0;padding:3px 0;\">\n            " + list + "\n          </ul>\n        </div>\n      ",
          menu = document.body.appendChild(getDomNodefromHtml(menuHtml)),
          currentMenuShown = false,
          liHasChildrenShown = null,
          delay = null,
          show = function show(el, _show) {
        if (_show) {
          setStyle(el, {
            visibility: "hidden",
            display: "block",
            top: 0,
            left: "100%",
            right: "auto",
            bottom: "auto"
          });

          var _el$getBoundingClient = el.getBoundingClientRect(),
              right = _el$getBoundingClient.right,
              top = _el$getBoundingClient.top,
              bottom = _el$getBoundingClient.bottom,
              left = _el$getBoundingClient.left;

          if (right > document.documentElement.clientWidth) {
            setStyle(el, {
              right: "100%",
              left: "auto"
            });
          }

          if (bottom > document.documentElement.clientHeight) {
            setStyle(el, {
              bottom: 0,
              top: "auto"
            });
          }
          el.style.visibility = "visible";
        } else {
          el.style.display = "none";
          tomato.each(el.querySelectorAll("li"), function (e) {
            return removeClass(e, HOVER_CLASS_NAME);
          });
        }
      },
          _dismiss = function dismiss() {
        // destroy the menu
        if (!menu) {
          return;
        }

        tomato.consume(listeners, function (f) {
          return f && f();
        });
        if (menu && menu.parentNode) {
          menu.parentNode.removeChild(menu);
          menu = null;
        }
        _dismiss = null;
      },
          handleEvents = function handleEvents(e) {
        if (!menu) {
          return;
        }
        switch (e.type) {
          case "resize":
          case "DOMMouseScroll":
          case "mousewheel":
          case "blur":
            callback(true, null);
            _dismiss();
            break;
          case "contextmenu":
            if (currentMenuShown) {
              callback(true, null);
              _dismiss();
            }
            break;
          case "mousedown":
            if (menu.contains(e.target)) {
              return; // waint for click
            }
            break;
          case "click":
          case "touchstart":
            if (e.target === window || !menu.contains(e.target) && currentMenuShown) {
              callback(true, null);
              _dismiss();
            } else {
              var closestLi = getClosestLiElement(e.target),
                  disabled = closestLi && hasClass(closestLi, "disabled"),
                  callbackId = closestLi && closestLi.getAttribute("data-callback-id"),
                  hasChildren = closestLi && closestLi.hasAttribute("data-has-children");
              if (closestLi && callbackId != null && !disabled && !hasChildren) {
                callback(false, callbackId);
                _dismiss();
              }
            }
            break;
          case "mouseover":
            {
              // when hover outside of menu, just ignore it
              if (e.target === window || !menu.contains(e.target)) {
                if (delay) {
                  delay.cancel();
                  delay = null;
                }
                return;
              }
              e.target.focus();
              break;
            }
          case "focus":
          case "focusin":
            {
              // when focus outside of menu, dismiss it
              if (e.target === window || !menu.contains(e.target)) {
                callback(true, null);
                _dismiss();
                return;
              }
              var target = e.target,
                  _closestLi = getClosestLiElement(target);

              if (_closestLi) {
                var _hasChildren = _closestLi.hasAttribute("data-has-children"),
                    children = _closestLi.querySelector("ul, ol");

                if (hasClass(_closestLi, HOVER_CLASS_NAME)) {
                  return;
                }

                if (delay) {
                  delay.cancel();
                  delay = null;
                }

                delay = new Delay(function () {
                  // hide all the menu 
                  wipeAss(_closestLi);
                  if (_hasChildren) {
                    // show the new one if there is
                    show(children, true);
                    // highlight the current parent menu item
                    addClass(_closestLi, HOVER_CLASS_NAME);
                  }
                }, 200);
              }
              break;
            }
          case "keydown":
            {
              var keyCode = e.keyCode;
              switch (keyCode) {
                case 37: // left
                case 38: // up
                case 39: // right
                case 40:
                  // down
                  // step 0. get the controllable ul
                  var ul = getFocusedUl(menu),
                      li = getFocusedLi(ul),
                      keyWord = void 0;
                  if (ul) {
                    focusLi(ul, li, keyCode === 37 ? "parent" : keyCode === 38 ? "pre" : keyCode === 39 ? "child" : keyCode === 40 ? "next" : "");
                  }
                  break;
                case 27:
                  callback(true, null);
                  _dismiss();
                  break;
                case 32:
                case 13:
                  {
                    var _ul = getFocusedUl(menu),
                        _li = getFocusedLi(_ul);
                    if (_li) {
                      _li.click();
                    }
                    break;
                  }
              }
              e.preventDefault();
              break;
            }
        }
      },
          listeners = [listen(document, "mousedown", handleEvents), listen(document, "click", handleEvents), listen(document, "touchstart", handleEvents), listen(document, "contextmenu", handleEvents), listen(document, "mousewheel", handleEvents), listen(document, "DOMMouseScroll", handleEvents), listen(document, "resize", handleEvents), listen(document, "mouseover", handleEvents), listen(document, "focus", handleEvents), listen(document, "focusin", handleEvents), listen(document, "keydown", handleEvents), listen(window, "blur", handleEvents)],
          wipeAss = function wipeAss(el) {
        //0. get all the sibling and hide
        var e = void 0;
        for (e = el.parentNode.firstChild; e !== null; e = e.nextSibling) {
          if (e.querySelectorAll) {
            removeClass(e, HOVER_CLASS_NAME);
            tomato.each(e.querySelectorAll("ul, ol"), function (el) {
              return show(el, false);
            });
          }
        }
      },
          getFocusedUl = function getFocusedUl(menu) {
        var ul = null;
        if (menu.contains(document.activeElement)) {
          ul = tomato.closest(document.activeElement, "ul, ol");
        }
        if (ul) {
          return ul;
        }
        return tomato.findRight(menu.querySelectorAll("ul, ol"), function (e) {
          return e.style.display !== "none";
        });
      },
          getFocusedLi = function getFocusedLi(ul) {
        if (ul) {
          if (ul.contains(document.activeElement)) {
            return getClosestLiElement(document.activeElement);
          }
        }
        return null;
      },
          focusLi = function focusLi(ul, li, keyWord) {
        switch (keyWord) {
          case "pre":
            {
              var pre = li && tomato.prev(li, isFocusable) || tomato.lastChild(ul, isFocusable);
              if (pre) {
                pre.focus();
              }
              break;
            }
          case "next":
            {
              var nxt = li && tomato.next(li, isFocusable) || tomato.firstChild(ul, isFocusable);
              if (nxt) {
                nxt.focus();
              }
              break;
            }
          case "parent":
            if (li) {
              var parentLi = tomato.closest(ul, 'li');
              if (parentLi) {
                parentLi.focus();
              }
            }
            break;
          case "child":
            if (li) {
              var childUl = li.querySelector("ul, ol");
              if (childUl) {
                focusLi(childUl, null, "next");
              }
            }
            break;
        }
      },
          isFocusable = function isFocusable(el) {
        return el instanceof HTMLLIElement && !hasClass(el, "disabled") && el.querySelector("a");
      };

      setTimeout(function () {
        var menuStyle = getMenuPosition(menu, x, y);
        setStyle(menu, {
          left: menuStyle.left + "px",
          top: menuStyle.top + "px",
          visibility: "visible"
        });
        currentMenuShown = true;
      }, 0);

      return function () {
        callback(true, null);
        _dismiss();
      };
    }

    return tomatoContextmenu;
  }();
}(); 
        return tomatoContextmenu
      } ());