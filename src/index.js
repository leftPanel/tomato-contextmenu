import listen from './listen';
import tomato from './tomato';
import getDomNodefromHtml from './getDomNodefromHtml'
import getMenuPosition from './getMenuPosition'
import getClosestLiElement from './getClosestLiElement'
import menuItemParser from './menuItemParser'
import hasClass from './hasClass'
import addClass from './addClass';
import removeClass from './removeClass'
import Delay from './Delay';
import setStyle from './setStyle';

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
        case "blur":
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
            case 32:
            case 13: {
              let ul = getFocusedUl(menu)
                , li = getFocusedLi(ul);
              if (li) {
                li.click();
              }
              break;
            }
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
            let childUl = li.querySelector("ul, ol")
            if (childUl) {
              focusLi(childUl, null, "next");
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

export default tomatoContextmenu;