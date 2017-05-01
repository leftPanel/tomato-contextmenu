const contextMenu = (function () {
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
  function getClosestLiElement(el) {
    let e = null, safeCheck = 0;
    for (e = el; e; e = e.parentNode) {
      if (e.tagName && e.tagName.toUpperCase() === "LI") {
        return e;
      }
      if (safeCheck > 10) return null;
      safeCheck++;
    }
    return null;
  }
  function getAllLiElement(root) {
    let allLis = []
      , els = [root]
      , el = null;

    while (els.length) {
      el = els.shift();
      if (el && el.tagName && el.tagName.toUpperCase() === "LI") {
        allLis.push(el);
      }
      if (el.childNodes) {
        Array.prototype.unshift.apply(els, el.childNodes)
      }
    }
    return allLis;
  }

  function getDomNodefromHtml(html) {
    let div = document.createElement("div");
    div.innerHTML = html.replace(/^[^<]+|[^>]+$/g, "");
    return div.firstChild;
  }
  return function (actions, x, y) {
    let
      list = actions.map(item => {
        switch (item.kind) {
          case "separator":
            return `<li class="divider"></li>`;
          default:
            return `<li  class="${item.disabled && "disabled"} ${item.active && "selected"}"><a tabindex="-1" href="javascript:void(0);" >${item.text}</a></li>`
        }
      }).join("")
      , menuHtml = `
        <div class="dropdown clearfix context-menu" style="position: fixed;top:0px;left:0px;z-index:99999;visibility:hidden;">
          <ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu" style="display:block;position:static;margin-bottom:5px;">
            ${list}
          </ul>
        </div>
      `
      , menu = document.body.appendChild(getDomNodefromHtml(menuHtml))
      , currentMenuShown = false
      , dismiss = e => {
        if (e && e.type === "contextmenu") {
          if (!currentMenuShown) {
            return;
          }
        }
        if (!e || e.target === window || !menu.contains(e.target)) {
          if (menu && menu.parentNode) {
            menu.parentNode.removeChild(menu);
          }
          document.removeEventListener("mousedown", dismiss);
          document.removeEventListener("click", dismiss);
          document.removeEventListener("touchstart", dismiss);
          document.removeEventListener("contextmenu", dismiss);
          document.removeEventListener("mousewheel", dismiss);
          document.removeEventListener("DOMMouseScroll", dismiss);
          document.removeEventListener("resize", dismiss);
          window.removeEventListener("blur", dismiss);
        } else {
          if (e.type === "mousedown") {
            // waiting for the click 
            return;
          }
          let cloestLi = getClosestLiElement(e.target)
            , allLis = getAllLiElement(menu)
            , idx = allLis.indexOf(cloestLi);
          if (idx >= 0 && !actions[idx].disabled) {
            actions[idx].onClick && actions[idx].onClick()
          }
          // console.log("click on the menu: ", idx);
          dismiss();
          return false;
        }
      };
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("click", dismiss);
    document.addEventListener("touchstart", dismiss);
    document.addEventListener("contextmenu", dismiss);
    document.addEventListener("mousewheel", dismiss);
    document.addEventListener("DOMMouseScroll", dismiss);
    document.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    setTimeout(() => {
      let menuStyle = getMenuPosition(menu, x, y);
      menu.style.left = menuStyle.left + "px";
      menu.style.top = menuStyle.top + "px";
      menu.style.visibility = "visible";
      currentMenuShown = true;
    }, 0);
  }
}());

export default contextMenu;