a.onclick = function (e) {
  e = e || window.event;

  e.preventDefault
    ? e.preventDefault()
    : e.returnValue = false;

  var actions =
    [
      {
        text: "menu item 1",
        callbackId: "menu-item-1",
        disabled: false,
        active: false
      },
      {
        text: "menu item 2",
        callbackId: "menu-item-2",
        disabled: false,
        active: false
      },
      {
        kind: "separator"
      },
      {
        text: "menu item 1",
        callbackId: "menu-item-disabled",
        disabled: true,
        active: false
      },
      {
        text: "menu active",
        callbackId: "menu-active",
        active: true
      },
      {
        kind: "separator"
      },
      {
        text: "menu hover menu hovermenu hovermenu hover",
        children: [
          {
            text: "submenu a",
            callbackId: "submenu-a",
            children: [
              {
                text: "first-grand-som",
                callbackId: "first-grand-som-children-of-submenu-of-submenu",
                children: [
                  {
                    text: "yet-another-first-grand-som",
                    callbackId: "yet-another-first-grand-som",

                  }
                ]
              }
            ]
          },
          {
            kind: "separator"
          },
          {
            text: "submenu of submenu",
            children: [
              {
                text: "children of submenu of submenu",
                callbackId: "children-of-submenu-of-submenu"
              }
            ]
          }
        ]
      },
      {
        text: "last child",
        callbackId: "last-child",
        children: [
          {
            text: "last child child",
            callbackId: "last-child-child",

          }
        ]
      }
    ]
    , callback = function (miss, callbackId) {
      if (miss) {
        console.log("miss");
        return;
      }
      console.log("hit: ", callbackId)
    };

  if (tomatoContextmenu) {
    var dismiss = tomatoContextmenu({
      actions: actions,
      x: e.clientX,
      y: e.clientY,
      callback: callback
    });
  }
}
