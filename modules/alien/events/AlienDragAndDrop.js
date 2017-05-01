// iframe is weird!!!
const DROP_NO = "data:image/gif;base64,R0lGODlhEAAQAIcAAMAAAMEEBMQQEMUUFMccHMkkJM00NM88PNRQUNVUVNlkZNpoaNxwcN10dOSQkOecnOmkpOuwsO24uO68vO/AwPDExPHIyPLMzPXY2Pfg4Pjk5Pno6Pvw8Pz09P34+P///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAMAAB8ALAAAAAAQABAAAAiSAD8IHNiBAoUOAxMOjGAAgMMAByoo/LABAQACDSA8YCAAgAKEAy0u4JBQg0MGCwE0mOgQQIALAg0UADmwpYYBCT50AOBAYUuBDAZ8oABgQsKfAh8AyCChaE2HCZVi4MBTINKBQWPOvCrwZs4PEVoCmJjgZUiHJAdqSAAA5cCKFzNu7PhxIsOWECVOJCjBgoeJAQEAOw==";
const DROP_YES = "data:image/gif;base64,R0lGODlhEAAQAIcAACdyJCZ/Iyl3JSl6JTR8MDV/MSaEIyqPJTWPMT+FOz+LOz+NOz+ZPDuhJ0yXPUKhM0ShM0mwJ1G3LlWzNV21P1q+N06bQVKgQl6pSGSwTGy2Vm23V261WG+1WG+1WWq5UHS3W3S3XHC/V3C4WXG5W3K5W3O6XHG+X3e8YH23Zny6ZH28Zn2+Z3+4aVzAO1zDPWbFSWrDSWzFS2nISnTCWXLLVW/CYW/DYW7EYW7EYm7FY2/GZHDBY3HEY3DHZXPHZnTDZHLIaHTIaHXIaHbJaXbKannBZH7BaX7Hb3nJa3rMbX/KcIO+bYfCcoXFdYDKc4DMcoPOd4fJeYnEdovIeJDOf5G5j5C8jpbHg5HAj5bLhpfMhZTIj5bNiJrHh5jLhprKh5jMh5nNip3Oi5nRi5nQjJrUjZvXkZ/SkJ/SkZ3YkqHWlaHXlaPXlqvSm6vTm6rcl63fm67Xoa/XoK7cpa/cprPZpbHdp7TZpbTaprLbqLXbqLTdqrTfrLXfrLbQtbbRtbfZtbrbtb7ftbDjn7Xhrrfhr7fhsL7jtr/juMHjtsDkucvsv8DAwMvtwNbu0tns1Ob04+336/H58PT68vz9+/3+/f///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAMAAI0ALAAAAAAQABAAAAjVABsJHEiwoEFCNVxUiAHHoEBHM2i0oUNnzYcJigoyelHFkJooUdQUotJgEEEYVQopKRJEyJAkfaY8GBhHhCElQXzoyNEDERI/GLgIlMHmDJEdOG7YWHQpEpkxDARKuAPlx6FHPBJdqlTmiBwDAiPUWfJk0iVJW7uQYDEngEAKacwAkULpkiUtG0ps8aJAIJoMfIyccAJJjAYOIfJYuDIQQhM9KEyM8NABhJ0WBQgKOsBkT5gVKr7gSQEAUMFACC6AeeMGiwMCfxw2yrJggIAEVmTrJhgQADs="

const AlienDragAndDrop = new (function () {
  class AlienDragAndDrop {
    constructor() {
      /*
      * bind eventhandler to this 
      */
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleSelectStart = this.handleSelectStart.bind(this);
      this.handleDragStart = this.handleDragStart.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.handleMouseWheel = this.handleMouseWheel.bind(this);
      /*
      * some information shared by listeners
      */
      this.dragSource = null;
      this.dragLayer = null;
      this.dragStarted = false;
      this.autoScrollHandler = null;
      this.canDropTarget = null;
      this.transferData = null;
      this.startPoint = {};
    }

    install() {
      document.addEventListener("mousedown", this.handleMouseDown);
    }

    uninstall() {
      document.removeEventListener("mousedown", this.handleMouseDown);
    }

    /*
     * listen mousedown
     * trigger alien-dragstart, provide canDrag, setDragGhost(node, x, y);
     * if canDrag, stop all default behaviors of selectstart, dragstart, mousemove
     */
    handleMouseDown(e) {
      let target = e.target
        , canDrag = false
        , ghostNode = null
        , ghostOffsetX = null
        , ghostOffsetY = null;

      target.dispatchEvent(new CustomEvent("alien-dragstart", {
        bubbles: true,
        cancelable: true,
        detail: {
          canDrag: () => canDrag = true,
          setDragGhost: (ghost, x, y) => (ghostNode = ghost, ghostOffsetX = x, ghostOffsetY = y),
          setTransferData: data => this.transferData = data
        }
      }));

      if (canDrag) {
        document.addEventListener("selectstart", this.handleSelectStart);
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("dragstart", this.handleDragStart);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("mousewheel", this.handleMouseWheel)
        this.dragSource = target;

        if (ghostNode) {
          this.dragLayer = new DragLayer(ghostNode, ghostOffsetX, ghostOffsetY);
          this.dragLayer.hide();
          this.startPoint = this.getMousePositionRelativeView(e)
        }
      }
    }

    handleMouseMove(e) {
      e.preventDefault();
      let { x, y } = this.getMousePositionRelativeView(e)
        , canDrop = false
        , elementUnderMouse = null;

      clearTimeout(this.autoScrollHandler);

      if (Math.max(
        Math.abs(x - this.startPoint.x),
        Math.abs(y - this.startPoint.y)
      ) < 5) {
        // 手抖的不算!!!!!
        return;
      }

      this.dragLayer.setPosition(x, y); // relative to current view

      // show the ghost  only after the mouse first moves 
      if (!this.dragStarted) {
        this.dragLayer.show();
        this.dragStarted = true;
      }

      // fire alien-drag event on the source node
      this.dragSource.dispatchEvent(new CustomEvent("alien-drag", {
        bubbles: true,
        cancelable: true,
        detail: {
          clientX: e.clientX,
          clientY: e.clientY
        }
      }));

      // fire alien-dragover event on the element under mouse 
      this.dragLayer.unsetCursor();
      this.canDropTarget = null;
      this.dragLayer.hide();
      elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY)
      this.dragLayer.show();
      if (elementUnderMouse) {
        elementUnderMouse.dispatchEvent(new CustomEvent("alien-dragover", {
          bubbles: true,
          cancelable: true,
          detail: {
            canDrop: () => canDrop = true,
            dragSource: this.dragSource,
            transferData: this.transferData
          }
        }));

        if (canDrop) {
          this.canDropTarget = elementUnderMouse;
          this.dragLayer.setCursor()
        }
      }
      if (elementUnderMouse) {
        // auto scroll when the mouse is under the edge of scrollable element 
        let scrollable = this.getClosestScrollableElement(elementUnderMouse);
        // 从左边拖进来的时候经过左边缘不要滚动，通过延迟来过滤掉这种情况
        this.autoScrollHandler = setTimeout(() => {
          this.checkScroll(scrollable, this.getPointRelatingToVisibleBoudingBox(x, y, scrollable))
        }, 100)
      }
    }

    handleMouseWheel(e) {
      clearTimeout(this.autoScrollHandler);
    }

    checkScroll(element, { left, right, top, bottom, vsbw, hsbw }) {
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
        element.scrollLeft += dx;
        element.scrollTop += dy;
        // console.log("yes , im scrolling")

        clearTimeout(this.autoScrollHandler);
        this.autoScrollHandler = setTimeout(() => {
          this.checkScroll(element, {
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


    vh() {
      return Math.max(document.documentElement.clientHeight, window.innerHeight || screen.height);
    }

    vw() {
      return Math.max(document.documentElement.clientWidth, window.innerWidth || screen.width);
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

    handleMouseUp(e) {

      document.removeEventListener("selectstart", this.handleSelectStart);
      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("dragstart", this.handleDragStart);
      document.removeEventListener("mouseup", this.handleMouseUp);
      document.addEventListener("mousewheel", this.handleMouseWheel)

      clearTimeout(this.autoScrollHandler);
      this.dragLayer.destroy();
      this.dragLayer = null;

      // fire drop event 
      let elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY)
        , offset = this.getMousePositionRelatingToBoudingBox(e, elementUnderMouse);

      if (elementUnderMouse === this.canDropTarget && this.canDropTarget !== null) {
        this.canDropTarget.dispatchEvent(new CustomEvent("alien-drop", {
          bubbles: true,
          cancelable: true,
          detail: {
            dragSource: this.dragSource,
            transferData: this.transferData,
            offsetX: offset.left,
            offsetY: offset.top
          }
        }));
      }

      // fire dragend event 
      this.dragSource.dispatchEvent(new CustomEvent("alien-dragend", {
        bubbles: true,
        cancelable: true,
        detail: null
      }));

      // clear source
      this.dragSource = null;
      this.dragStarted = false;
      this.transferData = null;
      this.startPoint = {};
    }

    /*
    * dragstart should preventDefault
    */
    handleDragStart(e) {
      e.preventDefault();
    }
    handleSelectStart(e) {
      e.preventDefault();
    }

    getMousePositionRelativeView(e) {
      let offset = {
        x: e.clientX,
        y: e.clientY
      }
      return offset;
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

  class DragLayer {
    constructor(node, offsetX, offsetY) {
      const CursorOffset = 20;

      let wrapper = document.createElement("div")
        , cursorDomNode = document.createElement("img")
        , clonedNode = node.cloneNode(true);

      // wrapper.style.position = "fixed";
      // wrapper.style.zIndex = 9999;
      // wrapper.style.width = node.offsetWidth + "px";
      // wrapper.style.height = node.offsetHeight + "px";
      wrapper.style.cssText = `position:fixed;z-index:9999;width:${node.offsetWidth}px;height:${node.offsetHeight}px;display:none;`

      // clonedNode.style.position = "absolute";
      // clonedNode.style.top = 0;
      // clonedNode.style.left = 0;
      clonedNode.style.cssText = "position:absolute;top:0;left:0;"

      cursorDomNode.width = CursorOffset;
      cursorDomNode.height = CursorOffset;
      // cursorDomNode.style.position = "absolute";
      // cursorDomNode.style.top = `${-CursorOffset / 3}px`;
      // cursorDomNode.style.left = `${-CursorOffset / 3}px`;
      // cursorDomNode.style.opacity = 0.8;
      cursorDomNode.style.cssText = `position:absolute;top:${-CursorOffset / 3}px;left:${-CursorOffset / 3}px;opacity:.8;`
      cursorDomNode.src = DROP_NO

      wrapper.appendChild(clonedNode);
      wrapper.appendChild(cursorDomNode);

      document.body.appendChild(wrapper);

      this.wrapper = wrapper;
      this.cursorDomNode = cursorDomNode;
      this.offsetX = offsetX;
      this.offsetY = offsetY;

      this.handleSelectStart = this.handleSelectStart.bind(this);
      this.wrapper.addEventListener("selectstart", this.handleSelectStart);
      this.wrapper.addEventListener("dragstart", this.handleSelectStart);
      this.wrapper.addEventListener("mousemove", this.handleSelectStart);
    }

    handleSelectStart(e) {
      e.preventDefault();
    }

    setPosition(x, y) {
      this.wrapper.style.top = y - this.offsetY + "px";
      this.wrapper.style.left = x - this.offsetX + "px";
    }

    hide() {
      this.wrapper.style.display = "none";
    }

    show() {
      this.wrapper.style.display = "block";
    }

    destroy() {
      this.wrapper.removeEventListener("selectstart", this.handleSelectStart);
      this.wrapper.removeEventListener("dragstart", this.handleSelectStart);
      this.wrapper.removeEventListener("mousemove", this.handleSelectStart);
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    setCursor() {
      this.cursorDomNode.src = DROP_YES;
    }

    unsetCursor() {
      this.cursorDomNode.src = DROP_NO;
    }
  }

  return AlienDragAndDrop;
}())

export default AlienDragAndDrop