const tomatoContextmenu = (function() {
        
      //module X:\tomato-contextmenu\src\listen.js start: 

      
      const listen = (function() {
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

 
        return listen
      } ());
    
//module X:\tomato-contextmenu\src\listen.js end

//module X:\tomato-contextmenu\src\tomato.js start: 

      
      const tomato = (function() {
        class Tomato {
  map(list, fn) {
    var l, i, res;
    for (l = list.length, i = 0, res = []; i < l; i++) {
      res.push(fn(list[i], i, list));
    }

    return res;
  }

  each(list, fn) {
    var l, i, li = list;
    for (l = li.length, i = 0; i < l; i++) {
      fn(li[i], i, li);
    }
  }

  consume(list, fn) {
    while (list.length) {
      return fn(list.shift());
    }
  }

  findRight(list, fn) {
    let i;
    for (i = list.length - 1; i >= 0; i--) {
      if (fn(list[i], i, list)) {
        return list[i];
      }
    }
    return null;
  }

  closest(el, sel) {
    if (el.closest) {
      return el.closest(sel);
    }
    let e;
    for (e = el; e; e = e.parentNode) {
      if (this.matches(e, sel)) {
        return e;
      }
    }
    return null;
  }

  matches(el, sel) {
    let useRaw, res;
    this.each(
      ["matches", "matchesSelector", "msMatchesSelector", "oMatchesSelector", "webkitMatchesSelector"],
      function (fn) {
        if (el[fn]) {
          useRaw = true;
          res = el[fn](sel);
        }
      }
    );

    if (useRaw) {
      return res;
    }

    var els = (el.parentNode || el.ownerDocument || document).querySelectorAll(sel),
      i = els.length;
    while (--i >= 0 && els.item(i) !== el) { }
    return i > -1;
  }

  prev(el, sel) {
    let e;
    for (e = el.previousSibling; e; e = e.previousSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }

  next(el, sel) {
    let e;
    for (e = el.nextSibling; e; e = e.nextSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }

  lastChild(el, sel) {
    let e;

    for (e = el.lastChild; e; e = e.previousSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }

  firstChild(el, sel) {
    let e;

    for (e = el.firstChild; e; e = e.nextSibling) {
      if (e.nodeType === 1 && sel(e)) {
        return e;
      }
    }
    return null;
  }
}

const tomato = new Tomato;

 
        return tomato
      } ());
    
//module X:\tomato-contextmenu\src\tomato.js end

//module X:\tomato-contextmenu\src\getDomNodefromHtml.js start: 

      
      const getDomNodefromHtml = (function() {
        function getDomNodefromHtml(html) {
  var div = document.createElement('div')
  , i;
  div.innerHTML = html;

  for (i = 0; i < div.childNodes.length; i ++) {
    if (div.childNodes[i].nodeType === 1) {
      return div.childNodes[i];
    }
  }
  return null;
}

 
        return getDomNodefromHtml
      } ());
    
//module X:\tomato-contextmenu\src\getDomNodefromHtml.js end

//module X:\tomato-contextmenu\src\getMenuPosition.js start: 

      
      const getMenuPosition = (function() {
          function getMenuPosition(menu, x, y) {
    let
      menuStyles = {
        top: y,
        left: x
      }
      , bottom = document.documentElement.clientHeight
      , right = document.documentElement.clientWidth
      , height = menu.clientHeight
      , width = menu.clientWidth;

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

 
        return getMenuPosition
      } ());
    
//module X:\tomato-contextmenu\src\getMenuPosition.js end

//module X:\tomato-contextmenu\src\getClosestLiElement.js start: 

      
      const getClosestLiElement = (function() {
        function getClosestLiElement(el) {
  if (el.closest) {
    return el.closest("li");
  }
  let e = null;
  for (e = el; e; e = e.parentNode) {
    if (e.tagName && e.tagName.toUpperCase() === "LI") {
      return e;
    }
  }
  return null;
}

 
        return getClosestLiElement
      } ());
    
//module X:\tomato-contextmenu\src\getClosestLiElement.js end

//module X:\tomato-contextmenu\src\menuItemParser.js start: 

      
      const menuItemParser = (function() {
        

const menuItemParser = ({ kind, text, disabled, active, callbackId, children }) => {
  let dataHasChildren = children ? "data-has-children" : "";
  switch (kind) {
    case "separator":
      return `<li class="divider" style="margin:3px 0;"></li>`;
    default:
      return `<li tabindex="0" class="${disabled && "disabled"} ${active && "active"}" data-callback-id="${callbackId}" style="position:relative;" ${dataHasChildren}>
        <a tabindex="-1" href="javascript:void(0);" style="outline:0;">${text}</a>
        ${children ? `<span class="glyphicon glyphicon-menu-right" style="position: absolute; top: 7px;right:2px;"></span>` : ""}
        ${children ? `<ul  class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu" style="position:absolute;left:auto;top:0;right:100%;display:none;margin:0;padding:3px 0;">${tomato.map(children, menuItemParser).join("")}</ul>` : ""}
      </li>`
  }
};

 
        return menuItemParser
      } ());
    
//module X:\tomato-contextmenu\src\menuItemParser.js end

//module X:\tomato-contextmenu\src\hasClass.js start: 

      
      const hasClass = (function() {
        function hasClass(el, className) {
  if (el.nodeType !== 1) {
    return false;
  }

  if (el.classList) {
    return el.classList.contains(className);
  }

  let list = el.className.split(/\s+/)
    , i;

  for (i = 0; i < list.length; i++) {
    if (list[i] === className) {
      return true;
    }
  }
  return false;
}

 
        return hasClass
      } ());
    
//module X:\tomato-contextmenu\src\hasClass.js end

//module X:\tomato-contextmenu\src\addClass.js start: 

      
      const addClass = (function() {
        function addClass(el, className) {
  if (el.nodeType === 1) {
    if (el.classList) {
      el.classList.add(className);
      return;
    }
    el.className += ` ${className} `
  }
}

 
        return addClass
      } ());
    
//module X:\tomato-contextmenu\src\addClass.js end

//module X:\tomato-contextmenu\src\removeClass.js start: 

      
      const removeClass = (function() {
        function removeClass(el, className) {
  if (el.nodeType === 1) {

    if (el.classList) {
      el.classList.remove(className);
      return;
    }

    let list = el.className.split(/\s+/)
      , i, nl = [];

    for (i = 0; i < list.length; i++) {
      if (list[i] !== className) {
        nl.push(list[i]);
      }
    }
    el.className = nl.join(" ");
  }
}

 
        return removeClass
      } ());
    
//module X:\tomato-contextmenu\src\removeClass.js end

//module X:\tomato-contextmenu\src\Delay.js start: 

      
      const Delay = (function() {
        class Delay {
  constructor(job, delay) {
    this.done = false;
    this.job = job;
    this.cancelHanler = setTimeout(() => {
      job();
      this.done = true;
      this.job = null;
    }, delay)
  }

  skip() {
    if (!this.done) {
      this.job();
    }
  }

  cancel() {
    clearTimeout(this.cancelHanler);
  }
}

 
        return Delay
      } ());
    
//module X:\tomato-contextmenu\src\Delay.js end

//module X:\tomato-contextmenu\src\setStyle.js start: 

      
      const setStyle = (function() {
        function setStyle(el, style) {
  let text = el.style.cssText
    , rcss = parse(text)
    , mcss = {...rcss, ...style}
    
  el.style.cssText = stringify(mcss);
}

function parse(text) {
  let css = {}
    , list = text.split(/\s*;\s*/g)
    , i;

  for (i = 0; i < list.length; i++) {
    let [name, value] = list[i].split(/\s*:\s*/g);
    css[name] = value;
  }
  return css;
}

function stringify(css) {
  let text = ""
    , name;
  for (name in css) {
    if (css.hasOwnProperty(name)) {
      text += `${name}:${css[name]};`
    }
  }
  return text;
}


 
        return setStyle
      } ());
    
//module X:\tomato-contextmenu\src\setStyle.js end

      return (function() {
          











const HOVER_CLASS_NAME = "hover";

function tomatoContextmenu({
  actions,
  x,
  y,
  callback
}) {
  let
    list = tomato.map(actions, menuItemParser).join("")
    , menuHtml = `
        <div class="dropdown clearfix context-menu" style="position: fixed;top:0px;left:0px;z-index:99999;visibility:hidden;">
          <ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu" style="display:block;position:static;margin:0;padding:3px 0;">
            ${list}
          </ul>
        </div>
      `
    , menu = document.body.appendChild(getDomNodefromHtml(menuHtml))
    , currentMenuShown = false
    , liHasChildrenShown = null
    , delay = null
    , show = function (el, show) {
      if (show) {
        setStyle(el, {
          visibility: "hidden",
          display: "block",
          top: 0,
          left: "100%",
          right: "auto",
          bottom: "auto"
        });
        let { right, top, bottom, left } = el.getBoundingClientRect();
        if (right > document.documentElement.clientWidth) {
          setStyle(el, {
            right: "100%",
            left: "auto",
          });
        }

        if (bottom > document.documentElement.clientHeight) {
          setStyle(el, {
            bottom: 0,
            top: "auto",
          });
        }
        el.style.visibility = "visible";
      } else {
        el.style.display = "none";
        tomato.each(el.querySelectorAll("li"), e => removeClass(e, HOVER_CLASS_NAME))
      }
    }
    , dismiss = function () {
      // destroy the menu
      if (!menu) {
        return;
      }

      tomato.consume(listeners, f => f && f());
      if (menu && menu.parentNode) {
        menu.parentNode.removeChild(menu);
        menu = null;
      }
      dismiss = null;
    }
    , handleEvents = function (e) {
      if (!menu) {
        return;
      }
      switch (e.type) {
        case "resize":
        case "DOMMouseScroll":
        case "mousewheel":
          // case "blur":
          callback(true, null);
          dismiss();
          break;
        case "contextmenu":
          if (currentMenuShown) {
            callback(true, null);
            dismiss();
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
            dismiss();
          } else {
            let closestLi = getClosestLiElement(e.target)
              , disabled = closestLi && (hasClass(closestLi, "disabled"))
              , callbackId = closestLi && closestLi.getAttribute("data-callback-id")
              , hasChildren = closestLi && closestLi.hasAttribute("data-has-children");
            if (closestLi && (callbackId != null) && !disabled && !hasChildren) {
              callback(false, callbackId);
              dismiss();
            }
          }
          break;
        case "mouseover": {
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
        case "focusin": {
          // when focus outside of menu, dismiss it
          if (e.target === window || !menu.contains(e.target)) {
            callback(true, null);
            dismiss();
            return;
          }
          let target = e.target
            , closestLi = getClosestLiElement(target)

          if (closestLi) {
            let hasChildren = closestLi.hasAttribute("data-has-children")
              , children = closestLi.querySelector("ul, ol");

            if (hasClass(closestLi, HOVER_CLASS_NAME)) {
              return;
            }

            if (delay) {
              delay.cancel();
              delay = null;
            }

            delay = new Delay(function () {
              // hide all the menu 
              wipeAss(closestLi);
              if (hasChildren) {
                // show the new one if there is
                show(children, true);
                // highlight the current parent menu item
                addClass(closestLi, HOVER_CLASS_NAME);
              }
            }, 200);
          }
          break;
        }
        case "keydown": {
          let keyCode = e.keyCode;
          switch (keyCode) {
            case 37:// left
            case 38:// up
            case 39:// right
            case 40:// down
              // step 0. get the controllable ul
              let ul = getFocusedUl(menu)
                , li = getFocusedLi(ul)
                , keyWord;
              if (ul) {
                focusLi(
                  ul,
                  li,
                  keyCode === 37
                    ? "parent"
                    : keyCode === 38
                      ? "pre"
                      : keyCode === 39
                        ? "child"
                        : keyCode === 40
                          ? "next"
                          : "")
              }
              break;
            case 27:
              callback(true, null);
              dismiss();
              break;
            case 13:
              console.log("enter");
              break;
          }
          e.preventDefault();
          break;
        }
      }
    }
    , listeners = [
      listen(document, "mousedown", handleEvents),
      listen(document, "click", handleEvents),
      listen(document, "touchstart", handleEvents),
      listen(document, "contextmenu", handleEvents),
      listen(document, "mousewheel", handleEvents),
      listen(document, "DOMMouseScroll", handleEvents),
      listen(document, "resize", handleEvents),
      listen(document, "mouseover", handleEvents),
      listen(document, "focus", handleEvents),
      listen(document, "focusin", handleEvents),
      listen(document, "keydown", handleEvents),
      listen(window, "blur", handleEvents),
    ]
    , wipeAss = function (el) {
      //0. get all the sibling and hide
      let e;
      for (e = el.parentNode.firstChild; e !== null; e = e.nextSibling) {
        if (e.querySelectorAll) {
          removeClass(e, HOVER_CLASS_NAME)
          tomato.each(e.querySelectorAll("ul, ol"), el => show(el, false))
        }
      }
    }
    , getFocusedUl = function (menu) {
      let ul = null;
      if (menu.contains(document.activeElement)) {
        ul = tomato.closest(document.activeElement, "ul, ol");
      }
      if (ul) {
        return ul;
      }
      return tomato.findRight(menu.querySelectorAll("ul, ol"), function (e) {
        return e.style.display !== "none";
      });
    }
    , getFocusedLi = function (ul) {
      if (ul) {
        if (ul.contains(document.activeElement)) {
          return getClosestLiElement(document.activeElement);
        }
      }
      return null;
    }
    , focusLi = function (ul, li, keyWord) {
      switch (keyWord) {
        case "pre": {
          let pre = (li && tomato.prev(li, isFocusable)) || tomato.lastChild(ul, isFocusable);
          if (pre) {
            pre.focus();
          }
          break;
        }
        case "next": {
          let nxt = (li && tomato.next(li, isFocusable)) || tomato.firstChild(ul, isFocusable);
          if (nxt) {
            nxt.focus();
          }
          break;
        }
        case "parent":
          if (li) {
            let parentLi = tomato.closest(ul, 'li');
            if (parentLi) {
              parentLi.focus();
            }
          }
          break;
        case "child":
          if (li) {
            let childUl = 
            if (parentLi) {
              parentLi.focus();
            }
          }
          break;
      }
    }
    , isFocusable = function (el) {
      return (el instanceof HTMLLIElement) && !hasClass(el, "disabled") && el.querySelector("a");
    }

  setTimeout(() => {
    let menuStyle = getMenuPosition(menu, x, y);
    setStyle(menu, {
      left: `${menuStyle.left}px`,
      top: `${menuStyle.top}px`,
      visibility: "visible"
    });
    currentMenuShown = true;
  }, 0);

  return function () {
    callback(true, null);
    dismiss();
  };
}

 
          return tomatoContextmenu
        } ());
     
        
      } ());