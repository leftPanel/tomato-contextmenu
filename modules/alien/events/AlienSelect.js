const AlienSelect = new (function () {
  class AlienSelect {
    constructor() {
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleSelectStart = this.handleSelectStart.bind(this);
      this.handleDragStart = this.handleDragStart.bind(this);
      this.handleScroll = this.handleScroll.bind(this);

      this.seletableNodes = [];
      this.enteredNodes = [];
      this.selectHelper = null;

      this.autoScrollTimeoutHanlder = null;
      this.startPoint = {};
      this.container = null;
      this.closestScrollableElement = null;
      this.lastScrollTop = null;
      this.lastScrolLeft = null;
      this.endPoint = null;
    }

    install() {
      document.addEventListener("mousedown", this.handleMouseDown)
    }

    uninstall() {
      document.removeEventListener("mousedown", this.handleMouseDown)
    }

    handleMouseDown(e) {
      let canSelect = false;
      e.target.dispatchEvent(new CustomEvent("alien-selectstart", {
        bubbles: true,
        cancelable: true,
        detail: {
          canSelect: () => canSelect = true,
          setSeletable: nodes => this.seletableNodes = nodes
        }
      }));

      if (canSelect) {
        this.container = e.target;
        this.closestScrollableElement = this.getClosestScrollableElement(this.container);
        this.startPoint = this.getMousePositionRelatingToBoudingBox(e, this.container);
        this.lastScrollTop = this.closestScrollableElement.scrollTop;
        this.lastScrolLeft = this.closestScrollableElement.scrollLeft;
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("selectstart", this.handleSelectStart);
        document.addEventListener("dragstart", this.handleDragStart);
        this.closestScrollableElement.addEventListener("scroll", this.handleScroll);
        // console.log("this.closestScrollableElement: ", this.closestScrollableElement)
      }
    }

    handleMouseUp(e) {
      this.destroySelectHelper();
      this.seletableNodes = [];
      this.enteredNodes = [];
      this.selectHelper = null;

      clearTimeout(this.autoScrollTimeoutHanlder)
      this.autoScrollTimeoutHanlder = null;

      this.startPoint = {};
      this.endPoint = null;
      this.container = null;

      this.lastScrollTop = null;
      this.lastScrolLeft = null;
      this.closestScrollableElement.removeEventListener("scroll", this.handleScroll)
      this.closestScrollableElement = null;

      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("mouseup", this.handleMouseUp);
      document.removeEventListener("selectstart", this.handleSelectStart);
      document.removeEventListener("dragstart", this.handleDragStart);
    }

    handleMouseMove(e) {
      e.preventDefault();
      clearTimeout(this.autoScrollTimeoutHanlder)

      if (!this.selectHelper) {
        this.selectHelper = this.createSelectHelper();
      }

      let endPoint = this.getMousePositionRelatingToBoudingBox(e, this.container);
      this.setSelectHelperSize(endPoint);
      this.endPoint = endPoint;


      // check the cursor if is on the edge of the closestScrollableElement
      this.checkScroll(this.getPointRelatingToVisibleBoudingBox(e.clientX, e.clientY, this.closestScrollableElement));

      let box = this.selectHelper.getBoundingClientRect();
      this.raiseEvent(box);
    }

    insert(rect1, rect2) {
      var overlap = !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom)
      return overlap;
    }

    raiseEvent(box) {
      let i = 0
        , rect = {}
        , selected = []
        , coveredNode = []
        , idx;

      for (i = 0; i < this.seletableNodes.length; i++) {
        rect = this.seletableNodes[i].getBoundingClientRect();
        if (this.insert(box, rect)) {
          coveredNode.push(this.seletableNodes[i]);
        }
      }

      for (i = 0; i < this.enteredNodes.length; i++) {
        idx = coveredNode.indexOf(this.enteredNodes[i]);
        if (idx < 0) {
          // trigger leave 
          // console.log("leave: ", this.enteredNodes[i])
          // this.onSelectLeave(this.enteredNodes[i]);
          this.enteredNodes[i].dispatchEvent(new CustomEvent("alien-selectleave", {
            bubbles: true,
            cancelable: true,
            detail: null
          }));
          this.enteredNodes.splice(i, 1);
          i--;
        } else {

        }
      }
      for (i = 0; i < coveredNode.length; i++) {
        idx = this.enteredNodes.indexOf(coveredNode[i]);
        if (idx < 0) {
          // trigger enter 
          // console.log("enter: ", coveredNode[i])
          // this.onSelectEnter(coveredNode[i]);
          coveredNode[i].dispatchEvent(new CustomEvent("alien-selectenter", {
            bubbles: true,
            cancelable: true,
            detail: null
          }));
          this.enteredNodes.push(coveredNode[i]);
        }
      }

    }

    handleScroll() {
      let st = this.closestScrollableElement.scrollTop
        , sl = this.closestScrollableElement.scrollLeft
        , dtop = st - this.lastScrollTop
        , dleft = sl - this.lastScrolLeft;

      this.lastScrollTop = st;
      this.lastScrolLeft = sl;

      if (dtop > 0) { // scroll down;
        this.endPoint.top += dtop;
      }
      if (dtop < 0) { // scroll up;
        this.endPoint.top += dtop;
      }
      if (dleft > 0) { // scroll right
        this.endPoint.left += dleft;
      }
      if (dleft < 0) { // scroll left;
        this.endPoint.left += dleft;
      }
      this.setSelectHelperSize(this.endPoint)
    }

    checkScroll({ left, right, top, bottom, vsbw, hsbw }) {
      const gate = 20
        , F = gate
        , timeout = 10
        , f = .3;
      let dx = 0
        , dy = 0
        , rb = bottom - hsbw
        , rr = right - vsbw;
      if (rb < gate) {
        dy += (F - rb) * f;
      } else if (top < gate) {
        dy -= (F - top) * f;
      }
      if (rr < gate) {
        dx += (F - rr) * f;
      } else if (left < gate) {
        dx -= (F - left) * f;
      }
      if (dx || dy) {
        this.closestScrollableElement.scrollLeft += dx;
        this.closestScrollableElement.scrollTop += dy;

        clearTimeout(this.autoScrollTimeoutHanlder);
        this.autoScrollTimeoutHanlder = setTimeout(() => {
          this.checkScroll({
            left: left,
            right: right,
            top: top,
            bottom: bottom,
            vsbw,
            hsbw
          })
        }, timeout)
      }
    }

    createSelectHelper() {
      let div = document.createElement("div");
      div.innerHTML = `<div style="position:absolute;visibility:hidden;background:#888;opacity:.3"></div>`;
      let helper = div.firstChild;
      this.container.appendChild(helper);
      return helper;
    }

    setSelectHelperSize(endPoint) {
      let { top, left, width, height } = this.getSelectHelperSize(endPoint);
      if (this.selectHelper) {
        this.selectHelper.style.top = top + "px";
        this.selectHelper.style.left = left + "px";
        this.selectHelper.style.width = width + "px";
        this.selectHelper.style.height = height + "px";
        this.selectHelper.style.visibility = "visible";
      }
    }

    getSelectHelperSize(endPoint) {
      let left = Math.min(this.startPoint.left, endPoint.left)
        , top = Math.min(this.startPoint.top, endPoint.top)
        , width = Math.max(this.startPoint.left, endPoint.left) - left
        , height = Math.max(this.startPoint.top, endPoint.top) - top;
      if (left + width >= this.container.offsetWidth) {
        width = this.container.offsetWidth - left;
      }
      if (top + height >= this.container.offsetHeight) {
        height = this.container.offsetHeight - top;
      }
      return {
        left: left,
        top: top,
        width: width,
        height: height
      };
    }

    destroySelectHelper() {
      if (this.selectHelper) {
        this.selectHelper.parentNode.removeChild(this.selectHelper);
      }
    }

    handleSelectStart(e) {
      e.preventDefault();
    }

    handleDragStart(e) {
      e.preventDefault();
    }

    getMousePositionRelatingToBoudingBox(e, a) {
      let cx = e.clientX
        , cy = e.clientY
        , boundingBox = a.getBoundingClientRect()
        // IE8 NaN error
        , b = boundingBox.bottom - cy - (parseFloat(getComputedStyle(a, null).borderBottomWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginBottom, 10) || 0)
        , t = cy - boundingBox.top - (parseFloat(getComputedStyle(a, null).borderTopWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginTop, 10) || 0)
        , l = cx - boundingBox.left - (parseFloat(getComputedStyle(a, null).borderLeftWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginLeft, 10) || 0)
        , r = boundingBox.right - cx - (parseFloat(getComputedStyle(a, null).borderRightWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginRight, 10) || 0)
        , vScrollbarWidth = a.offsetWidth - a.clientWidth
        , hScrollbarWidth = a.offsetHeight - a.clientHeight
      return {
        left: l,
        right: r,
        top: t,
        bottom: b,
        vsbw: vScrollbarWidth,
        hsbw: hScrollbarWidth
      }
    }

    getPointRelatingToVisibleBoudingBox(x, y, a) {
      let cx = x
        , cy = y
        , boundingBox = a.getBoundingClientRect()
        , bottom = boundingBox.bottom > this.vh() ? this.vh() : boundingBox.bottom
        , top = boundingBox.top < 0 ? 0 : boundingBox.top
        , left = boundingBox.left < 0 ? 0 : boundingBox.left
        , right = boundingBox.right > this.vw() ? this.vw() : boundingBox.right
        // IE8 NaN error
        , b = bottom - cy - (parseFloat(getComputedStyle(a, null).borderBottomWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginBottom, 10) || 0)
        , t = cy - top - (parseFloat(getComputedStyle(a, null).borderTopWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginTop, 10) || 0)
        , l = cx - left - (parseFloat(getComputedStyle(a, null).borderLeftWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginLeft, 10) || 0)
        , r = right - cx - (parseFloat(getComputedStyle(a, null).borderRightWidth, 10) || 0) + (parseFloat(getComputedStyle(a, null).marginRight, 10) || 0)
        , vScrollbarWidth = a.offsetWidth - a.clientWidth
        , hScrollbarWidth = a.offsetHeight - a.clientHeight
      return {
        left: l,
        right: r,
        top: t,
        bottom: b,
        vsbw: vScrollbarWidth,
        hsbw: hScrollbarWidth
      }
    }

    vh() {
      return Math.max(document.documentElement.clientHeight, window.innerHeight || screen.height);
    }

    vw() {
      return Math.max(document.documentElement.clientWidth, window.innerWidth || screen.width);
    }

    /*
* get cloest scrollable element, nested scrollable will not bubble
*/
    getClosestScrollableElement(element, includeHidden = false) {
      let elementStyle = getComputedStyle(element)
        , overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/
        , parentElement
        , parentStyle
        , isAbsoluted = elementStyle.position === "absolute"
        , isFixed = elementStyle.position === "fixed"
        , isTransformed = false
        , isOverflowed = false;


      for (parentElement = element; (parentElement = parentElement.parentElement);) {
        parentStyle = getComputedStyle(parentElement);

        isTransformed = (parentStyle.transform !== "none" && parentStyle.transform !== undefined)
          || (parentStyle.webkitTransform !== undefined && parentStyle.webkitTransform !== "none")
          || (parentStyle.MsTransform !== undefined && parentStyle.MsTransform !== "none");
        isOverflowed = overflowRegex.test(parentStyle.overflow + parentStyle.overflowY + parentStyle.overflowX);


        if (!(isAbsoluted && parentStyle.position === "static")) {
          if (isFixed && isTransformed) {
            return parentElement;
          }
          if (isOverflowed) {
            return parentElement;
          }
        }
      }

      return document.body;
    }
  }

  return AlienSelect;
}());

export default AlienSelect;