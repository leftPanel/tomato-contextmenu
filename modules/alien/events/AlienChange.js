const AlienChange = new (function () {
  const LAST_VALUE_KEY = "_last-value"
  const CHECK_TIMEOUT = 200;
  const
    iev = (function () {
      var rv = -1;
      if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent,
          re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
          rv = parseFloat(RegExp.$1);
      }
      return rv;
    }())
    , isIELE9 = iev > -1 && iev <= 9;


  class AlienChange {
    constructor() {
      this.handleChange = this.handleChange.bind(this);
      this.handleInput = this.handleInput.bind(this);

      this.check = this.check.bind(this);
      let timeoutCheck = () => {
        this.check();
        this.timeoutHandler = setTimeout(timeoutCheck, CHECK_TIMEOUT);
      }
      this.timeoutCheck = timeoutCheck;

      this.timeoutHandler = null;
    }

    install() {
      if (isIELE9) {
        this.timeoutHandler = setTimeout(this.timeoutCheck, CHECK_TIMEOUT)
      } else {
        document.addEventListener("input", this.handleInput);
        document.addEventListener("change", this.handleChange)
      }
    }

    uninstall() {
      if (isIELE9) {
        clearTimeout(this.timeoutHandler)
      } else {
        document.removeEventListener("input", this.handleInput);
        document.removeEventListener("change", this.handleChange)
      }
    }


    handleInput(e) {
      e.target.dispatchEvent(new CustomEvent("alien-change", {
        bubbles: true,
        cancelable: true,
        detail: null
      }));
    }

    handleChange(e) {
      e.target.dispatchEvent(new CustomEvent("alien-change", {
        bubbles: true,
        cancelable: true,
        detail: null
      }));
    }

    check() {
      let allControls = getAllControls(document)
        , i = 0
        , control = null
        , value = null;

      for (i = 0; i < allControls.length; i++) {
        control = allControls[i];
        if (typeof control[LAST_VALUE_KEY] === "undefined") {
          control[LAST_VALUE_KEY] = control.value;
        } else {
          value = control[LAST_VALUE_KEY];
          currentValue = control.value;
          if (currentValue !== value) {
            // trigger change 
            console.log("old value: ", value);
            console.log("new value: ", currentValue);
            control[LAST_VALUE_KEY] = currentValue;
            control.dispatchEvent(new CustomEvent("alien-change", {
              bubbles: true,
              cancelable: true,
              detail: null
            }));
          }
        }
      }
    }
  }
  function getAllControls(node) {
    var isMSIE = /*@cc_on!@*/0;
    if (node.querySelectorAll && !isMSIE) {
      return Array.prototype.slice.call(
        node.querySelectorAll("input:not([type=checkbox]):not([type=radio]), textarea, select"),
        0
      )
    } else {
      let res = []
        , all = getAllChildElements(node)
        , i = 0;

      for (i = 0; i < all.length; i++) {
        if (all[i]
          && all[i].nodeName
          && (all[i].nodeName.toUpperCase() === "INPUT" || all[i].nodeName.toUpperCase() === "TEXTAREA" || all[i].nodeName.toUpperCase() === "SELECT")
          && (all[i].type !== "checkbox" || all[i].type !== "radio")) {
          res.push(all[i]);
        }
      }
      return res;
    }
  }

  function getAllChildElements(node) {
    if (node === node.ownerDocument) {
      return node.getElementsByTagName("*")
    } else {
      let childNodeList = []
        , i = 0;

      for (i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeType === 1) {
          Array.prototype.push.apply(
            childNodeList,
            [
              node.childNodes[i],
              ...getAllChildElements(node.childNodes[i])
            ]
          )
        }
      }
      return childNodeList;
    }
  }
  return AlienChange;
}());

export default AlienChange;